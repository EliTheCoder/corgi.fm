import {List, Set, Stack} from 'immutable'
import {createSelector} from 'reselect'
import {ActionType} from 'typesafe-actions'
import {ConnectionNodeType, Id, IMultiStateThing} from '../common-types'
import {assertArrayHasNoUndefinedElements} from '../common-utils'
import {logger} from '../logger'
import {makeMidiClipEvent, MidiClip} from '../midi-types'
import {IMidiNote, MidiNotes} from '../MidiNote'
import {
	deserializeSequencerState, PLAY_SEQUENCER, RECORD_SEQUENCER_NOTE, RECORD_SEQUENCER_REST,
	selectAllInfiniteSequencers, SequencerAction, SequencerStateBase, STOP_SEQUENCER, TOGGLE_SEQUENCER_RECORDING,
} from './sequencer-redux'
import {VirtualKeyPressedAction} from './virtual-keyboard-redux'
import {
	addMultiThing, BROADCASTER_ACTION, CLEAR_SEQUENCER, createSequencerEvents, IClientRoomState, IMultiState,
	IMultiStateThings, makeMultiReducer, NetworkActionType, PLAY_ALL, selectGlobalClockState,
	SERVER_ACTION, SKIP_NOTE, STOP_ALL, UNDO_SEQUENCER, VIRTUAL_KEY_PRESSED,
} from './index'

export const addInfiniteSequencer = (infiniteSequencer: InfiniteSequencerState) =>
	addMultiThing(infiniteSequencer, ConnectionNodeType.infiniteSequencer, NetworkActionType.SERVER_AND_BROADCASTER)

export const SET_INFINITE_SEQUENCER_NOTE = 'SET_INFINITE_SEQUENCER_NOTE'
export const DELETE_INFINITE_SEQUENCER_NOTE = 'DELETE_INFINITE_SEQUENCER_NOTE'
export const RESTART_INFINITE_SEQUENCER = 'RESTART_INFINITE_SEQUENCER'
export const SET_INFINITE_SEQUENCER_FIELD = 'SET_INFINITE_SEQUENCER_FIELD'

export const infiniteSequencerActions = Object.freeze({
	setNote: (infiniteSequencerId: Id, index: number, enabled: boolean, note: IMidiNote) => ({
		type: SET_INFINITE_SEQUENCER_NOTE as typeof SET_INFINITE_SEQUENCER_NOTE,
		id: infiniteSequencerId,
		index,
		enabled,
		note,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	}),
	deleteNote: (infiniteSequencerId: Id, index: number) => ({
		type: DELETE_INFINITE_SEQUENCER_NOTE as typeof DELETE_INFINITE_SEQUENCER_NOTE,
		id: infiniteSequencerId,
		index,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	}),
	restart: (id: Id) => ({
		type: RESTART_INFINITE_SEQUENCER as typeof RESTART_INFINITE_SEQUENCER,
		id,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	}),
	setField: (id: Id, fieldName: InfiniteSequencerFields, data: any) => ({
		type: SET_INFINITE_SEQUENCER_FIELD as typeof SET_INFINITE_SEQUENCER_FIELD,
		id,
		fieldName,
		data,
		...getNetworkFlags(fieldName),
	}),
})

function getNetworkFlags(fieldName: InfiniteSequencerFields) {
	if ([
		InfiniteSequencerFields.gate,
		InfiniteSequencerFields.bottomNote,
		InfiniteSequencerFields.pitch,
		InfiniteSequencerFields.style,
		InfiniteSequencerFields.showRows,
		InfiniteSequencerFields.rate,
	].includes(fieldName)) {
		return {SERVER_ACTION, BROADCASTER_ACTION}
	} else {
		return {}
	}
}

export enum InfiniteSequencerFields {
	gate = 'gate',
	bottomNote = 'bottomNote',
	index = 'index',
	pitch = 'pitch',
	style = 'style',
	showRows = 'showRows',
	rate = 'rate',
}

export interface IInfiniteSequencersState extends IMultiState {
	things: IInfiniteSequencers
}

export interface IInfiniteSequencers extends IMultiStateThings {
	[key: string]: InfiniteSequencerState
}

export enum InfiniteSequencerStyle {
	colorBars = 'colorBars',
	colorGrid = 'colorGrid',
}

export class InfiniteSequencerState extends SequencerStateBase {
	public static defaultWidth = 688
	public static defaultHeight = 88
	public static controlsWidth = (40 * 4) + (64 * 3)
	public static notesStartX = InfiniteSequencerState.controlsWidth + 4
	public static notesWidth = InfiniteSequencerState.defaultWidth - InfiniteSequencerState.controlsWidth - 8

	public static dummy = new InfiniteSequencerState(
		'dummy', 'dummy', InfiniteSequencerStyle.colorGrid, List(), false,
	)

	public readonly style: InfiniteSequencerStyle
	public readonly showRows: boolean

	public constructor(
		ownerId: string,
		name = 'Infinite Sequencer',
		style = InfiniteSequencerStyle.colorGrid,
		events = createSequencerEvents(4)
			.map((_, i) => (makeMidiClipEvent({
				notes: MidiNotes(i % 2 === 1 ? [] : [36]),
				startBeat: i,
				durationBeats: 1,
			}))),
		isPlaying = false,
	) {
		const midiClip = new MidiClip({
			events,
			length: events.count(),
			loop: true,
		})

		super(
			name,
			midiClip,
			InfiniteSequencerState.defaultWidth,
			InfiniteSequencerState.defaultHeight,
			ownerId,
			ConnectionNodeType.infiniteSequencer,
			InfiniteSequencerState.notesStartX,
			InfiniteSequencerState.notesWidth,
			isPlaying,
			0.5,
		)

		this.showRows = false
		this.style = style
	}
}

export function deserializeInfiniteSequencerState(state: IMultiStateThing): IMultiStateThing {
	const x = state as InfiniteSequencerState
	const y: InfiniteSequencerState = {
		...(new InfiniteSequencerState(x.ownerId)),
		...(deserializeSequencerState(x)),
		width: Math.max(x.width, InfiniteSequencerState.defaultWidth),
		height: Math.max(x.height, InfiniteSequencerState.defaultHeight),
		notesDisplayStartX: InfiniteSequencerState.notesStartX,
		notesDisplayWidth: InfiniteSequencerState.notesWidth,
	}
	return y
}

const infiniteSequencerActionTypes = [
	SET_INFINITE_SEQUENCER_NOTE,
	DELETE_INFINITE_SEQUENCER_NOTE,
	SET_INFINITE_SEQUENCER_FIELD,
	CLEAR_SEQUENCER,
	UNDO_SEQUENCER,
	PLAY_SEQUENCER,
	STOP_SEQUENCER,
	RECORD_SEQUENCER_NOTE,
	RECORD_SEQUENCER_REST,
	TOGGLE_SEQUENCER_RECORDING,
]

assertArrayHasNoUndefinedElements(infiniteSequencerActionTypes)

const infiniteSequencerGlobalActionTypes = [
	PLAY_ALL,
	STOP_ALL,
	VIRTUAL_KEY_PRESSED,
	SKIP_NOTE,
]

assertArrayHasNoUndefinedElements(infiniteSequencerGlobalActionTypes)

type InfiniteSequencerAction = SequencerAction | ActionType<typeof infiniteSequencerActions> | VirtualKeyPressedAction

export const infiniteSequencersReducer =
	makeMultiReducer<InfiniteSequencerState, IInfiniteSequencersState>(
		infiniteSequencerReducer, ConnectionNodeType.infiniteSequencer,
		infiniteSequencerActionTypes, infiniteSequencerGlobalActionTypes,
	)

function infiniteSequencerReducer(
	infiniteSequencer: InfiniteSequencerState, action: InfiniteSequencerAction,
): InfiniteSequencerState {
	switch (action.type) {
		case SET_INFINITE_SEQUENCER_NOTE: {
			return {
				...infiniteSequencer,
				midiClip: infiniteSequencer.midiClip.withMutations(mutable => {
					mutable.set('events', mutable.events.map((event, eventIndex) => {
						if (eventIndex === action.index) {
							if (action.enabled) {
								return {
									...event,
									notes: Set([action.note]),
								}
							} else {
								return {
									...event,
									notes: event.notes.filter(x => x !== action.note),
								}
							}
						} else {
							return event
						}
					}))
					mutable.set('length', mutable.events.count())
				}),
				previousEvents: infiniteSequencer.previousEvents.unshift(infiniteSequencer.midiClip.events),
			}
		}
		case DELETE_INFINITE_SEQUENCER_NOTE: {
			return {
				...infiniteSequencer,
				midiClip: infiniteSequencer.midiClip.withMutations(mutable => {
					mutable.set(
						'events',
						mutable.events.filter(({startBeat}) => startBeat !== action.index)
							.map(event => event.startBeat > action.index ? {...event, startBeat: event.startBeat - 1} : event))
					mutable.set('length', mutable.events.count())
				}),
				previousEvents: infiniteSequencer.previousEvents.unshift(infiniteSequencer.midiClip.events),
			}
		}
		case TOGGLE_SEQUENCER_RECORDING: return {...infiniteSequencer, isRecording: action.isRecording}
		case SET_INFINITE_SEQUENCER_FIELD:
			if (action.fieldName === InfiniteSequencerFields.index) {
				return {
					...infiniteSequencer,
					[action.fieldName]: action.data % infiniteSequencer.midiClip.events.count(),
				}
			} else {
				return {
					...infiniteSequencer,
					[action.fieldName]: action.data,
				}
			}
		case UNDO_SEQUENCER: {
			if (infiniteSequencer.previousEvents.count() === 0) return infiniteSequencer

			const prv = Stack(infiniteSequencer.previousEvents)

			return {
				...infiniteSequencer,
				midiClip: infiniteSequencer.midiClip.withMutations(mutable => {
					mutable.set('events', prv.first())
					mutable.set('length', mutable.events.count())
				}),
				previousEvents: prv.shift().toList(),
			}
		}
		case CLEAR_SEQUENCER: {
			if (infiniteSequencer.midiClip.events.count() === 0) return infiniteSequencer

			return {
				...infiniteSequencer,
				midiClip: infiniteSequencer.midiClip.withMutations(mutable => {
					mutable.set('events', createSequencerEvents(0))
					mutable.set('length', mutable.events.count())
				}),
				previousEvents: infiniteSequencer.previousEvents.unshift(infiniteSequencer.midiClip.events),
			}
		}
		case PLAY_SEQUENCER: return {...infiniteSequencer, isPlaying: true, isRecording: false}
		case STOP_SEQUENCER: return {...infiniteSequencer, isPlaying: false, isRecording: false}
		case PLAY_ALL: return {...infiniteSequencer, isPlaying: true}
		case STOP_ALL: return {...infiniteSequencer, isPlaying: false, isRecording: false}
		case RECORD_SEQUENCER_REST:
		case RECORD_SEQUENCER_NOTE:
			if (infiniteSequencer.isRecording) {
				return {
					...infiniteSequencer,
					midiClip: infiniteSequencer.midiClip.withMutations(mutable => {
						mutable.set('events', mutable.events
							.concat(makeMidiClipEvent({
								notes: action.type === RECORD_SEQUENCER_NOTE
									? MidiNotes([action.note])
									: action.type === RECORD_SEQUENCER_REST
										? MidiNotes()
										: (() => {logger.error('nope'); return MidiNotes()})(),
								startBeat: mutable.events.count(),
								durationBeats: 1,
							})),
						)
						mutable.set('length', mutable.events.count())
					}),
					previousEvents: infiniteSequencer.previousEvents.unshift(infiniteSequencer.midiClip.events),
				}
			} else {
				return infiniteSequencer
			}
		default:
			return infiniteSequencer
	}
}

export const selectInfiniteSequencer = (state: IClientRoomState, id: string) => selectAllInfiniteSequencers(state)[id] || InfiniteSequencerState.dummy

export const selectInfiniteSequencerIsActive = (state: IClientRoomState, id: string) =>
	selectInfiniteSequencer(state, id).isPlaying

export const selectInfiniteSequencerIsSending = (state: IClientRoomState, id: string) =>
	selectInfiniteSequencerActiveNotes(state, id).count() > 0

const emptyNotes = MidiNotes()

export const selectInfiniteSequencerActiveNotes = createSelector(
	[selectInfiniteSequencer, selectGlobalClockState],
	(infiniteSequencer, globalClockState) => {
		if (!infiniteSequencer) return emptyNotes
		if (!infiniteSequencer.isPlaying) return emptyNotes

		const globalClockIndex = globalClockState.index

		const index = globalClockIndex

		if (index >= 0 && infiniteSequencer.midiClip.events.count() > 0) {
			return infiniteSequencer.midiClip.events.get((index / Math.round(infiniteSequencer.rate)) % infiniteSequencer.midiClip.events.count())!.notes
		} else {
			return emptyNotes
		}
	},
)