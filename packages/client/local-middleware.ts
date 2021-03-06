import Immutable from 'immutable'
import {Dispatch, Middleware} from 'redux'
import uuid from 'uuid'
import {MAX_MIDI_NOTE_NUMBER_127, panelHeaderHeight, GroupId} from '@corgifm/common/common-constants'
import {ConnectionNodeType, IConnectable, RoomType} from '@corgifm/common/common-types'
import {applyOctave, createNodeId, clamp} from '@corgifm/common/common-utils'
import {logger} from '@corgifm/common/logger'
import {IMidiNote, IMidiNotes} from '@corgifm/common/MidiNote'
import {IClientRoomState} from '@corgifm/common/redux/common-redux-types'
import {
	selectAllConnections, selectConnectionsWithSourceIds,
	selectConnectionsWithSourceOrTargetIds, selectConnectionsWithTargetIds,
	doesConnectionBetweenNodesExist,
	selectConnectionsWithSourceId,
} from '@corgifm/common/redux/connections-redux'
import {
	addBasicSynthesizer, AddClientAction,
	addMultiThing, addPosition, addVirtualKeyboard,
	BasicSynthesizerState, Connection,
	connectionsActions, deletePositions, deleteThingsAny, findNodeInfo,
	GridSequencerAction,
	gridSequencerActions, GridSequencerFields, GridSequencerState, IClientAppState,
	IPosition, ISequencerState, LocalSaves, makePosition,
	MASTER_AUDIO_OUTPUT_TARGET_ID, MASTER_CLOCK_SOURCE_ID,
	NetworkActionType, CommonAction, SavedRoom, selectActiveRoom,
	selectAllPositions,
	selectClientInfo, selectDirectDownstreamSequencerIds,
	selectGlobalClockState, selectLocalClient,
	selectLocalClientId, selectLocalSocketId,
	selectPosition, selectPositionExtremes,
	selectRoomSettings, selectSequencer, selectShamuGraphState,
	selectVirtualKeyboardByOwner, sequencerActions,
	SetActiveRoomAction, setClientName, setLocalClientId,
	SetLocalClientNameAction,
	ShamuGraphState, shamuMetaActions,
	UpdatePositionsAction, UserInputAction,
	UserKeys, VirtualKeyboardState,
	virtualKeyPressed, VirtualKeyPressedAction,
	virtualKeyUp, VirtualKeyUpAction,
	virtualOctaveChange, VirtualOctaveChangeAction,
	LocalAction, chatSystemMessage, animationActions, selectOption, AppOptions,
	getNodeInfo, SequencerStateBase, localMidiKeyUp, selectUserInputKeys,
	userInputActions, recordingActions, betterSequencerActions,
	expNodesActions, expPositionActions, expConnectionsActions,
	selectExpConnectionsWithSourceOrTargetIds, selectExpNode,
	selectExpPosition,
	makeExpNodeState, makeExpPosition, ExpConnection,
	selectExpPositionExtremes, selectExpNodesState, WithConnections,
	selectShamuMetaState, selectExpAllConnections, ExpPosition, ExpNodeState,
	ExpConnections, ExpNodesState, ExpPositions, selectRoomInfoState,
	SavedClassicRoom, SavedExpRoom, selectExpGraphsState,
	selectActivityState, SavedDummyRoom, selectActivityType, expMidiPatternsActions, makeExpMidiPatternState, makeExpMidiPatternEvents,
} from '@corgifm/common/redux'
import {pointersActions} from '@corgifm/common/redux/pointers-redux'
import {makeMidiClipEvent, preciseModulus, preciseSubtract} from '@corgifm/common/midi-types'
import {graphStateSavesLocalStorageKey} from './client-constants'
import {GetAllInstruments} from './instrument-manager'
import {getSequencersSchedulerInfo, getCurrentSongTimeBeats} from './note-scanner'
import {saveUsernameToLocalStorage} from './username'
import {corgiApiActions} from './RestClient/corgi-api-middleware'
import {FirebaseContextStuff} from './Firebase/FirebaseContext'
import {onChangeRoom} from './WebAudio'
import {createResetZoomAction, createResetPanAction} from './SimpleGraph/Zoom'

type LocalMiddlewareActions = LocalAction | AddClientAction
	| VirtualKeyPressedAction | GridSequencerAction
	| UserInputAction | VirtualKeyUpAction | VirtualOctaveChangeAction
	| SetActiveRoomAction | CommonAction
	| UpdatePositionsAction | SetLocalClientNameAction

/** Key is the key number that was pressed, value is the note that was played (key number with octave applied) */
let _localMidiKeys = Immutable.Map<number, IMidiNote>()
let _localSustainedNotes = Immutable.Map<number, IMidiNotes>()

export function createLocalMiddleware(
	getAllInstruments: GetAllInstruments, firebase: FirebaseContextStuff
): Middleware<{}, IClientAppState> {
	return ({dispatch, getState}) => next => async function localMiddleware(action: LocalMiddlewareActions) {

		const beforeState = getState()
		const localClientId = selectLocalClientId(beforeState)

		switch (action.type) {
			case 'WINDOW_BLUR': {
				next(action)

				dispatch(userInputActions.localMidiSustainPedal(false))

				const state = getState()

				const localVirtualKeyboard = selectLocalVirtualKeyboard(state)

				return localVirtualKeyboard.pressedKeys.forEach(key => {
					dispatch(localMidiKeyUp(key, 'WINDOW_BLUR'))
				})
			}
			case 'LOCAL_MIDI_KEY_PRESS': {
				const localVirtualKeyboard = selectVirtualKeyboardByOwner(beforeState.room, localClientId)
				const sourceId = localVirtualKeyboard.id
				const noteToPlay = applyOctave(action.midiNote, localVirtualKeyboard.octave)
				const directlyConnectedSequencerIds = selectDirectDownstreamSequencerIds(beforeState.room, sourceId).toArray()

				if (_localMidiKeys.has(action.midiNote)) {
					return
					// I think we used to do the below when we wanted to retrigger notes when changing octaves
					// but we don't do that anymore, and now there's a weird chrome/windows behavior
					// that repeats a keydown event when letting up a different key
					// so gonna try disabling this, and if it doesn't cause other issues
					// then it will stay commented out
					// dispatch(localMidiKeyUp(action.midiNote, 'LOCAL_MIDI_KEY_PRESS'))
				}

				_localMidiKeys = _localMidiKeys.set(action.midiNote, noteToPlay)

				const targetIds = selectConnectionsWithSourceIds(beforeState.room, [sourceId].concat(directlyConnectedSequencerIds))
					.map(x => x.targetId)
					.valueSeq()
					.toSet()

				dispatch(
					virtualKeyPressed(
						sourceId,
						action.midiNote,
						noteToPlay,
						action.velocity,
						targetIds,
					)
				)

				const currentSongTimeBeats = getCurrentSongTimeBeats()

				// add note to sequencer if downstream recording sequencer
				_getDownstreamRecordingSequencers(beforeState, localVirtualKeyboard.id)
					.forEach(sequencer => {
						const info = getSequencersSchedulerInfo().get(sequencer.id, null)

						// Why this?
						// Maybe if song hasn't been started yet?
						// TODO
						if (!info) return dispatch(sequencerActions.recordNote(sequencer.id, noteToPlay))

						const clipLength = sequencer.midiClip.length

						const index = Math.ceil((clipLength * info.loopRatio) + 0.5) - 1

						const actualIndex = index >= clipLength ? 0 : index

						const actualMidiNote = clamp(noteToPlay, 0, MAX_MIDI_NOTE_NUMBER_127 - 1)

						if (sequencer.type === ConnectionNodeType.gridSequencer) {
							const gridSequencer = sequencer as GridSequencerState

							const topNote = gridSequencer.scrollY + GridSequencerState.notesToShow - 1

							let needToScroll = 0

							// determine if new note is out of view
							if (actualMidiNote < gridSequencer.scrollY) {
								needToScroll = actualMidiNote - gridSequencer.scrollY
							} else if (actualMidiNote > topNote) {
								needToScroll = actualMidiNote - topNote
							}

							if (needToScroll !== 0) {
								dispatch(gridSequencerActions.setField(gridSequencer.id, GridSequencerFields.scrollY, gridSequencer.scrollY + needToScroll))
							}
						}

						dispatch(recordingActions.startEvent({
							ownerId: localClientId,
							note: actualMidiNote,
							startBeat: currentSongTimeBeats,
							sequencerId: sequencer.id,
						}))
						return dispatch(sequencerActions.recordNote(sequencer.id, actualMidiNote, actualIndex))
					})

				next(action)

				return
			}
			case 'VIRTUAL_KEY_PRESSED': {
				getAllInstruments()
					.filter(x => action.targetIds.includes(x.id))
					.forEach(instrument => {
						instrument.scheduleNote(action.midiNote, 0, true, Immutable.Set([action.id]), action.velocity)
					})

				const state = getState()
				const fancy = selectOption(state, AppOptions.graphicsExtraAnimations)

				if (fancy) dispatch(animationActions.on(action.targetIds, action.midiNote))

				return next(action)
			}
			case 'LOCAL_MIDI_KEY_UP': {
				const noteToRelease = _localMidiKeys.get(action.midiNote, null)

				if (noteToRelease === null) return

				_localMidiKeys = _localMidiKeys.delete(action.midiNote)

				const state = getState()
				const sustain = selectUserInputKeys(state).sustainPedalPressed

				if (sustain) {
					_localSustainedNotes = _localSustainedNotes.update(action.midiNote, Immutable.Set(), notes => notes.add(noteToRelease))
					return
				}

				const localVirtualKeyboard = selectLocalVirtualKeyboard(state)
				const sourceId = localVirtualKeyboard.id
				const directlyConnectedSequencerIds = selectDirectDownstreamSequencerIds(state.room, sourceId).toArray()

				const targetIds = selectConnectionsWithSourceIds(state.room, [sourceId].concat(directlyConnectedSequencerIds))
					.map(x => x.targetId)
					.valueSeq()
					.toSet()

				dispatch(
					virtualKeyUp(
						sourceId,
						action.midiNote,
						noteToRelease,
						targetIds,
					),
				)

				const recordingEventsForOwnerAndNote = beforeState.room.recording.recordingEvents
					.filter(x => x.ownerId === localClientId && x.note === noteToRelease)

				if (recordingEventsForOwnerAndNote.count() > 0) {

					const currentSongTimeBeats = getCurrentSongTimeBeats()

					_getDownstreamRecordingSequencers(beforeState, localVirtualKeyboard.id)
						.forEach(sequencer => {

							const recordingEventsForSequencer = recordingEventsForOwnerAndNote
								.filter(x => x.sequencerId === sequencer.id)

							const event = recordingEventsForSequencer.first(null)

							if (!event) return

							if (recordingEventsForSequencer.count() > 1) {
								logger.warn(`I don't think this should happen`)
							}

							if (sequencer.type === ConnectionNodeType.betterSequencer) {
								dispatch(betterSequencerActions.addEvent(sequencer.id, makeMidiClipEvent({
									note: event.note,
									startBeat: preciseModulus(event.startBeat / sequencer.rate, sequencer.midiClip.length),
									durationBeats: preciseSubtract(currentSongTimeBeats, event.startBeat) / sequencer.rate,
								})))
							}
							return dispatch(recordingActions.endEvent(event.id))
						})
				}

				return next(action)
			}
			case 'VIRTUAL_KEY_UP': {
				getAllInstruments()
					.filter(x => action.targetIds.includes(x.id))
					.forEach(instrument => {
						instrument.scheduleRelease(action.midiNote, 0)
					})

				const state = getState()
				const fancy = selectOption(state, AppOptions.graphicsExtraAnimations)

				if (fancy) dispatch(animationActions.off(action.targetIds, action.midiNote))

				return next(action)
			}
			case 'LOCAL_MIDI_SUSTAIN_PEDAL': {
				if (!action.pressed) {
					const state = getState()
					const localVirtualKeyboard = selectLocalVirtualKeyboard(state)
					const sourceId = localVirtualKeyboard.id
					const directlyConnectedSequencerIds = selectDirectDownstreamSequencerIds(state.room, sourceId).toArray()

					const targetIds = selectConnectionsWithSourceIds(state.room, [sourceId].concat(directlyConnectedSequencerIds))
						.map(x => x.targetId)
						.valueSeq()
						.toSet()

					_localSustainedNotes.forEach((notes, number) => {
						notes.forEach(note => {
							dispatch(
								virtualKeyUp(
									sourceId,
									number,
									note,
									targetIds,
								),
							)
						})
					})

					_localSustainedNotes = _localSustainedNotes.clear()
				}

				return next(action)
			}
			case 'LOCAL_MIDI_OCTAVE_CHANGE': {
				next(action)
				// what do for scheduled keyboard notes?
				// release then schedule new ones
				// which ones?
				// all the pressed keys from keyboard state
				const state = getState()

				// const localVirtualKeyboard = getLocalVirtualKeyboard(state)

				// localVirtualKeyboard.pressedKeys.forEach(key => {
				// 	const noteToRelease = applyOctave(key, localVirtualKeyboard.octave)
				// 	const noteToSchedule = applyOctave(key, localVirtualKeyboard.octave + action.delta)
				// 	scheduleNote(noteToRelease, localVirtualKeyboard.id, state.room, 'off')
				// 	scheduleNote(noteToSchedule, localVirtualKeyboard.id, state.room, 'on')
				// })

				return dispatch(virtualOctaveChange(selectLocalVirtualKeyboardId(state), action.delta))
			}
			// case 'VIRTUAL_OCTAVE_CHANGE': {
			// 	const state = getState()

			// 	const keyboard = selectVirtualKeyboardById(state.room, action.id)

			// 	// TODO Store velocity in pressedKeys
			// 	keyboard.pressedKeys.forEach(key => {
			// 		const noteToRelease = applyOctave(key, keyboard.octave)
			// 		const noteToSchedule = applyOctave(key, keyboard.octave + action.delta)
			// 		scheduleNote(noteToRelease, keyboard.id, state, 'off',
			// 			getAllInstruments, dispatch, 1)
			// 		scheduleNote(noteToSchedule, keyboard.id, state, 'on',
			// 			getAllInstruments, dispatch, 1)
			// 	})

			// 	return next(action)
			// }
			case 'SET_GRID_SEQUENCER_NOTE': {
				if (action.enabled) {
					playShortNote(Immutable.Set([action.note]), action.id, getState().room, getAllInstruments)
				}

				next(action)

				return
			}
			case 'PLAY_SHORT_NOTE': {
				playShortNote(action.notes, action.sourceId, getState().room, getAllInstruments)

				next(action)

				return
			}
			case 'PLAY_SHORT_NOTE_ON_TARGET': {
				playShortNoteOnTarget(action.note, action.targetId, getAllInstruments)

				next(action)

				return
			}
			case 'SKIP_NOTE': {
				const state = getState()

				// add rest to sequencer if downstream recording sequencer
				_getDownstreamRecordingSequencers(state, selectLocalVirtualKeyboardId(state))
					.forEach(x => {
						dispatch(sequencerActions.recordRest(x.id))
					})

				return next(action)
			}
			case 'USER_KEY_PRESS': {
				if (action.key === UserKeys.Backspace) {
					const state = getState()

					// add rest to sequencer if downstream recording sequencer
					_getDownstreamRecordingSequencers(state, selectLocalVirtualKeyboardId(state))
						.forEach(x => {
							dispatch(sequencerActions.undo(x.id))
						})
				}

				return next(action)
			}
			case 'SET_LOCAL_CLIENT_NAME': {
				next(action)
				const localClient = selectLocalClient(getState())
				dispatch(setClientName(localClient.id, action.newName))
				saveUsernameToLocalStorage(action.newName)
				if (firebase.auth.currentUser) dispatch(corgiApiActions.saveLocalUser())
				return
			}
			case 'SET_ACTIVE_ROOM': {
				next(action)
				window.history.pushState({}, document.title, '/' + selectActiveRoom(getState()))
				onChangeRoom()
				const active: HTMLElement | null = document.activeElement as HTMLElement
				if (active && active.blur) active.blur()
				return
			}
			case 'ADD_CLIENT': {
				next(action)
				if (action.client.socketId === selectLocalSocketId(getState())) {
					dispatch(setLocalClientId(action.client.id))
				}
				return
			}
			case 'READY': {
				next(action)
				dispatch(createResetZoomAction())
				dispatch(createResetPanAction())
				return createLocalStuff(dispatch, getState())
			}
			case 'DELETE_NODE': {
				next(action)

				const newState = getState()

				const nodeId = action.nodeId

				dispatch(deleteThingsAny([nodeId], NetworkActionType.SERVER_AND_BROADCASTER))
				dispatch(deletePositions([nodeId]))
				dispatch(
					connectionsActions.delete(
						selectConnectionsWithSourceOrTargetIds(newState.room, [nodeId])
							.map(x => x.id)
							.toList(),
					),
				)

				return
			}
			case 'DELETE_EXP_NODE': {
				next(action)

				const newState = getState()

				const nodeId = action.nodeId

				const nodeIdsPlusChildren = getChildExpNodeIds(nodeId, newState).toArray()

				dispatch(expNodesActions.deleteMany(nodeIdsPlusChildren))
				dispatch(expPositionActions.delete(nodeIdsPlusChildren))
				dispatch(
					expConnectionsActions.delete(
						selectExpConnectionsWithSourceOrTargetIds(newState.room, nodeIdsPlusChildren)
							.map(x => x.id)
							.toList(),
					),
				)

				return
			}
			case 'CLONE_NODE': {
				next(action)

				const newState = getState()

				const nodeId = action.nodeId
				const nodeType = action.nodeType

				// Select multiThing
				const nodeInfo = findNodeInfo(action.nodeType)

				const stateToClone = nodeInfo.stateSelector(newState.room, nodeId)

				const clone: IConnectable = {
					...stateToClone,
					id: createNodeId(),
				}

				// dispatch add multi thing
				dispatch(addMultiThing(clone, nodeType, NetworkActionType.SERVER_AND_BROADCASTER))
				dispatch(shamuMetaActions.setSelectedNodes(Immutable.Set(clone.id)))

				// clone position
				const positionToClone = selectPosition(newState.room, nodeId)

				const clonePosition: IPosition = {
					...positionToClone,
					id: clone.id,
					x: positionToClone.x + 32,
					y: positionToClone.y + 32,
				}

				dispatch(addPosition(clonePosition))

				if (action.withConnections === 'all') {
					const newConnections = selectConnectionsWithSourceId(newState.room, nodeId)
						.map(x => ({
							...x,
							id: createNodeId(),
							sourceId: clone.id,
						}))
						.concat(
							selectConnectionsWithTargetIds(newState.room, nodeId)
								.map(x => ({
									...x,
									id: createNodeId(),
									targetId: clone.id,
								})),
						)
						.toList()

					if (newConnections.count() > 0) dispatch(connectionsActions.addMultiple(newConnections))
				} else if (action.withConnections === 'default') {
					if (nodeInfo.autoConnectToClock) {
						dispatch(connectionsActions.add(new Connection(
							MASTER_CLOCK_SOURCE_ID,
							ConnectionNodeType.masterClock,
							clone.id,
							clone.type,
							0,
							0,
						)))
					}
					if (nodeInfo.autoConnectToAudioOutput) {
						dispatch(connectionsActions.add(new Connection(
							clone.id,
							clone.type,
							MASTER_AUDIO_OUTPUT_TARGET_ID,
							ConnectionNodeType.audioOutput,
							0,
							0,
						)))
					}
				}

				return
			}
			case 'PRUNE_ROOM': {
				next(action)

				const state = getState()

				const nodesToDelete = selectAllPositions(state.room)
					.filter(x => [ConnectionNodeType.masterClock, ConnectionNodeType.audioOutput, ConnectionNodeType.virtualKeyboard].includes(x.targetType) === false)
					.filter(position => {
						return selectConnectionsWithSourceOrTargetIds(state.room, [position.id]).count() === 0
					})
					.map(x => x.id)
					.toIndexedSeq()
					.toArray()

				dispatch(deleteThingsAny(nodesToDelete, NetworkActionType.SERVER_AND_BROADCASTER))
				return dispatch(deletePositions(nodesToDelete))
			}
			case 'SAVE_ROOM_TO_BROWSER': {
				next(action)

				const state = getState()

				const room = selectActiveRoom(state)

				const localSaves = getOrCreateLocalSavesStorage()

				try {
					setLocalSavesToLocalStorage({
						...localSaves,
						all: localSaves.all.set(uuid.v4(), createRoomSave(state, room)),
					})

					return dispatch(chatSystemMessage('Room saved!', 'success'))
				} catch (error) {
					if (error instanceof Error) {
						if (error.name === 'QuotaExceededError') {
							return dispatch(chatSystemMessage('Browser save storage is full! Delete some saves to make room.', 'warning'))
						}
					}
					logger.error(`failed to save room to browser: `, error)
					return dispatch(chatSystemMessage('Something went wrong! An error has been logged.', 'error'))
				}
			}
			case 'SAVE_ROOM_TO_FILE': {
				next(action)

				const state = getState()

				const room = selectActiveRoom(state)

				const roomSave = createRoomSave(state, room)

				downloadObjectAsJson(roomSave, `${roomSave.saveDateTime.substring(0, 10)}-${room}`.replace(/ /g, '_'))

				return
			}
			case 'DELETE_SAVED_ROOM': {
				next(action)

				const localSaves = getOrCreateLocalSavesStorage()

				try {
					setLocalSavesToLocalStorage({
						...localSaves,
						all: localSaves.all.delete(action.id),
					})
				} catch (error) {
					logger.error(`failed to delete saved room from browser: `, error)
					dispatch(chatSystemMessage('Something went wrong! An error has been logged.', 'error'))
				}

				return
			}
			// case 'UPDATE_POSITIONS': {
			// 	// Mainly to handle loading old saves with smaller sizes
			// 	// Not perfect
			// 	// TODO I think we're doing this in 2 places...
			// 	const foo: ReturnType<typeof updatePositions> = {
			// 		...action,
			// 		positions: Immutable.Map(action.positions).map((position): IPosition => {
			// 			return {
			// 				...position,
			// 				width: Math.max(position.width, position.width),
			// 				height: Math.max(position.height, position.height),
			// 			}
			// 		}),
			// 	}

			// 	next(foo)

			// 	return
			// }
			case 'CONNECT_KEYBOARD_TO_NODE': {
				const nodeInfo = findNodeInfo(action.targetType)

				if (!nodeInfo.canHaveKeyboardConnectedToIt) return

				const state = getState()
				const localKeyboardId = selectLocalVirtualKeyboardId(state)

				if (
					doesConnectionBetweenNodesExist(
						state.room, localKeyboardId, 0, action.nodeId, 0)
				) return

				return dispatch(connectionsActions.add(new Connection(
					localKeyboardId,
					ConnectionNodeType.virtualKeyboard,
					action.nodeId,
					action.targetType,
					0,
					0,
				)))
			}
			default: return next(action)
		}
	}
}

function getChildExpNodeIds(nodeId: Id, state: IClientAppState): Immutable.Set<Id> {
	const allNodes = selectExpNodesState(state.room)
	let loopCount = 0
	const getChildIds = (_nodeId: Id): Immutable.Set<Id> => {
		if (loopCount++ > 500) {
			logger.error('loop count exceeded!', {_nodeId, loopCount})
			return Immutable.Set()
		}
		const childNodes = allNodes.filter(x => x.groupId === _nodeId).keySeq().toSet()
		return childNodes.concat(childNodes.map(getChildIds).reduce((result, x) => result.concat(x), Immutable.Set<Id>()))
	}
	return getChildIds(nodeId).add(nodeId)
}

function createRoomSave(state: IClientAppState, roomName: string): SavedRoom {
	const roomType = selectActivityType(state.room)
	switch (roomType) {
		case RoomType.Normal: return createClassicRoomSave(state, roomName)
		case RoomType.Experimental: return createExpRoomSave(state, roomName)
		case RoomType.Dummy: return createDummyRoomSave(state)
	}
}

function createClassicRoomSave(state: IClientAppState, roomName: string): SavedClassicRoom {
	return {
		connections: selectAllConnections(state.room),
		globalClock: selectGlobalClockState(state.room),
		positions: selectAllPositions(state.room),
		roomSettings: selectRoomSettings(state.room),
		shamuGraph: stripShamuGraphForSaving(selectShamuGraphState(state.room)),
		saveDateTime: new Date().toISOString(),
		saveClientVersion: selectClientInfo(state).clientVersion,
		saveServerVersion: selectClientInfo(state).serverVersion,
		room: roomName,
		roomType: RoomType.Normal,
		roomInfo: selectRoomInfoState(state.room),
	} as const
}

function createExpRoomSave(state: IClientAppState, roomName: string): SavedExpRoom {
	return {
		activity: selectActivityState(state.room),
		roomSettings: selectRoomSettings(state.room),
		saveDateTime: new Date().toISOString(),
		saveClientVersion: selectClientInfo(state).clientVersion,
		saveServerVersion: selectClientInfo(state).serverVersion,
		room: roomName,
		roomType: RoomType.Experimental,
		roomInfo: selectRoomInfoState(state.room),
	} as SavedExpRoom
}

function createDummyRoomSave(state: IClientAppState): SavedDummyRoom {
	return {
		roomSettings: selectRoomSettings(state.room),
		saveDateTime: new Date().toISOString(),
		saveClientVersion: selectClientInfo(state).clientVersion,
		saveServerVersion: selectClientInfo(state).serverVersion,
		room: 'dummyRoomName',
		roomType: RoomType.Dummy,
		roomInfo: selectRoomInfoState(state.room),
	} as SavedDummyRoom
}

function stripShamuGraphForSaving(shamuGraphState: ShamuGraphState): ShamuGraphState {
	return {
		...shamuGraphState,
		nodes: {
			...shamuGraphState.nodes,
			gridSequencers: {
				things: Immutable.Map(shamuGraphState.nodes.gridSequencers.things)
					.map(stripSequencerSaves)
					.toObject(),
			},
			infiniteSequencers: {
				things: Immutable.Map(shamuGraphState.nodes.infiniteSequencers.things)
					.map(stripSequencerSaves)
					.toObject(),
			},
			betterSequencers: {
				things: Immutable.Map(shamuGraphState.nodes.betterSequencers.things)
					.map(stripSequencerSaves)
					.toObject(),
			},
		},
	}
}

function stripSequencerSaves<T extends SequencerStateBase>(sequencer: T): T {
	return {
		...sequencer,
		previousEvents: Immutable.List(),
	}
}

function setLocalSavesToLocalStorage(localSaves: LocalSaves) {
	localStorage.setItem(graphStateSavesLocalStorageKey, JSON.stringify(localSaves))
}

// https://stackoverflow.com/questions/19721439/download-json-object-as-a-file-from-browser
function downloadObjectAsJson(exportObj: any, exportName: string) {
	const dataStr = JSON.stringify(exportObj)
	const blob = dataURIToBlob(dataStr)
	const objectUrl = URL.createObjectURL(blob)
	const downloadAnchorNode = document.createElement('a')
	downloadAnchorNode.setAttribute('href', objectUrl)
	downloadAnchorNode.setAttribute('download', exportName + '.json')
	// TODO
	// eslint-disable-next-line unicorn/prefer-node-append
	document.body.appendChild(downloadAnchorNode) // required for firefox
	downloadAnchorNode.click()
	downloadAnchorNode.remove()
	URL.revokeObjectURL(objectUrl)
}

// edited from https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob#Polyfill
function dataURIToBlob(dataURI: string): Blob {
	const binStr = dataURI
	const len = binStr.length
	const arr = new Uint8Array(len)

	for (let i = 0; i < len; i++) {
		arr[i] = binStr.charCodeAt(i)
	}

	return new Blob([arr])
}

export function getOrCreateLocalSavesStorage(): LocalSaves {
	const localSavesJSON = localStorage.getItem(graphStateSavesLocalStorageKey)

	if (localSavesJSON === null) return makeInitialLocalSavesStorage()

	const localSaves = parseLocalSavesJSON(localSavesJSON)

	// TODO Properly deserialize, checking for null stuff and versions, etc.

	return localSaves
}

function parseLocalSavesJSON(localSavesJSON: string): LocalSaves {
	try {
		const localSaves = JSON.parse(localSavesJSON) as LocalSaves

		if (!localSaves) {
			logger.warn('failed to parse localSavesJSON, was null after casting: ', localSavesJSON)
			return makeInitialLocalSavesStorage()
		} else {
			return {
				all: Immutable.Map<Id, SavedRoom>(localSaves.all).map((save): SavedRoom => {
					const foo = {
						...save,
						saveDateTime: save.saveDateTime || '?',
						saveClientVersion: save.saveClientVersion || '?',
						saveServerVersion: save.saveServerVersion || '?',
						room: save.room || '?',
					}
					foo.roomType = save.roomType || RoomType.Normal
					return foo
				}),
			}
		}
	} catch (error) {
		logger.error('error caught while trying to parse localSavesJSON: ', error)
		logger.error('localSavesJSON: ', localSavesJSON)
		return makeInitialLocalSavesStorage()
	}
}

const makeInitialLocalSavesStorage = (): LocalSaves => ({
	all: Immutable.Map(),
})

function playShortNote(
	notes: IMidiNotes, sourceId: Id, roomState: IClientRoomState,
	getAllInstruments: GetAllInstruments,
) {
	const targetIds = selectConnectionsWithSourceId(roomState, sourceId).map(x => x.targetId)
	const {gate, rate, pitch} = selectSequencer(roomState, sourceId)
	const bpm = selectGlobalClockState(roomState).bpm

	// Limit note length to 0.25 seconds
	const delayUntilRelease = Math.min(0.25, (60 / bpm) * rate * gate)

	const actualNotes = notes.map(x => x + pitch)

	getAllInstruments().forEach(instrument => {
		if (targetIds.includes(instrument.id) === false) return

		actualNotes.forEach(actualNote => {
			instrument.scheduleNote(actualNote, 0, true, Immutable.Set([sourceId]), 1)
			instrument.scheduleRelease(actualNote, delayUntilRelease)
		})
	})
}

function playShortNoteOnTarget(
	note: IMidiNote, targetId: Id,
	getAllInstruments: GetAllInstruments,
) {
	const delayUntilRelease = 0.25

	const instrument = getAllInstruments().get(targetId)

	if (!instrument) return

	instrument.scheduleNote(note, 0, true, Immutable.Set([]), 1)

	instrument.scheduleRelease(note, delayUntilRelease)
}

function selectLocalVirtualKeyboardId(state: IClientAppState) {
	return selectLocalVirtualKeyboard(state).id
}

function selectLocalVirtualKeyboard(state: IClientAppState) {
	return selectVirtualKeyboardByOwner(state.room, selectLocalClientId(state))
}

// TODO Refactor to use functions in create-server-stuff.ts
function createLocalStuff(dispatch: Dispatch, state: IClientAppState) {
	const roomType = selectActivityType(state.room)

	switch (roomType) {
		case RoomType.Experimental: return createLocalStuffExperimental(dispatch, state)
		case RoomType.Normal:
		default: return createLocalStuffNormal(dispatch, state)
	}
}

const expWidth = 400

function createLocalStuffExperimental(dispatch: Dispatch, state: IClientAppState) {

	const localClientId = selectLocalClientId(state)

	// dispatch(expMidiPatternsActions.add(makeExpMidiPatternState({
	// 	events: makeExpMidiPatternEvents([
	// 		{note: 72, startBeat: 0, duration: 3},
	// 	]),
	// })))

	const extremes = selectExpPositionExtremes(state.room)

	const newY = extremes.bottomMost + panelHeaderHeight + 32

	const keyboard = makeExpNodeState({
		type: 'keyboard',
		ownerId: localClientId,
		groupId: 'top',
	})

	dispatch(expNodesActions.add(keyboard))

	dispatch(expPositionActions.add(
		makeExpPosition({
			id: keyboard.id,
			ownerId: localClientId,
			x: (-expWidth * 3) - 200,
			y: newY,
			targetType: keyboard.type,
		})))

	const midiConverter = makeExpNodeState({
		type: 'midiConverter',
		ownerId: localClientId,
		groupId: 'top',
	})

	dispatch(expNodesActions.add(midiConverter))

	dispatch(expPositionActions.add(
		makeExpPosition({
			id: midiConverter.id,
			ownerId: localClientId,
			x: -expWidth * 2,
			y: newY,
			targetType: midiConverter.type,
		})))

	dispatch(expConnectionsActions.add(new ExpConnection(
		keyboard.id,
		keyboard.type,
		midiConverter.id,
		midiConverter.type,
		'output',
		'input',
		'midi',
		'top',
	)))
}

function createLocalStuffNormal(dispatch: Dispatch, state: IClientAppState) {
	const localClient = selectLocalClient(state)

	if (localClient.id.startsWith('fake')) {
		logger.warn('FAKE')
		return
	}

	dispatch(pointersActions.add(localClient.id))

	// Don't do anything else if only room owner can do stuff
	const roomSettings = selectRoomSettings(state.room)
	if (roomSettings.onlyOwnerCanDoStuff && selectLocalClientId(state) !== roomSettings.ownerId) return

	const extremes = selectPositionExtremes(state.room)

	const y = 128 + 32 + 44

	const newVirtualKeyboard = new VirtualKeyboardState()
	dispatch(addVirtualKeyboard(newVirtualKeyboard))
	const keyboardPosition = makePosition({
		...newVirtualKeyboard,
		id: newVirtualKeyboard.id,
		targetType: ConnectionNodeType.virtualKeyboard,
		x: -556 + 150 - ((64 * 6) / 2),
		y: extremes.bottomMost + y,
		width: getNodeInfo().virtualKeyboard.defaultWidth,
		height: getNodeInfo().virtualKeyboard.defaultHeight,
		color: localClient.color,
		ownerId: localClient.id,
	})
	dispatch(addPosition({
		...keyboardPosition,
		y: keyboardPosition.y - (keyboardPosition.height / 2),
	}))

	const nextPosition = {
		x: 174 - ((64 * 6) / 2),
		y: extremes.bottomMost + y,
	}

	const newInstrument = new BasicSynthesizerState()
	dispatch(addBasicSynthesizer(newInstrument))
	const instrumentPosition = makePosition({
		...newInstrument,
		id: newInstrument.id,
		targetType: ConnectionNodeType.basicSynthesizer,
		color: findNodeInfo(ConnectionNodeType.basicSynthesizer).color,
		ownerId: localClient.id,
		...nextPosition,
	})
	dispatch(addPosition({
		...instrumentPosition,
		y: instrumentPosition.y - (instrumentPosition.height / 2),
	}))

	// Source to target
	dispatch(connectionsActions.add(new Connection(
		newVirtualKeyboard.id,
		ConnectionNodeType.virtualKeyboard,
		newInstrument.id,
		ConnectionNodeType.basicSynthesizer,
		0,
		0,
	)))

	// Target to audio output
	dispatch(connectionsActions.add(new Connection(
		newInstrument.id,
		ConnectionNodeType.basicSynthesizer,
		MASTER_AUDIO_OUTPUT_TARGET_ID,
		ConnectionNodeType.audioOutput,
		0,
		0,
	)))
}

function _getDownstreamRecordingSequencers(
	state: IClientAppState, nodeId: Id
): Immutable.List<ISequencerState> {
	return selectDirectDownstreamSequencerIds(state.room, nodeId)
		.map(x => selectSequencer(state.room, x))
		.filter(x => x.isRecording)
}
