import {List, Stack} from 'immutable'
import {createSelector} from 'reselect'
import {ActionType} from 'typesafe-actions'
import {ConnectionNodeType, IMultiStateThing} from '../common-types'
import {
	assertArrayHasNoUndefinedElements,
} from '../common-utils'
import {makeMidiClipEvent, MidiClip} from '../midi-types'
import {emptyMidiNotes, IMidiNote, MidiNotes} from '../MidiNote'
import {
	deserializeSequencerState, SequencerAction,
	SequencerStateBase,
	selectAllBetterSequencers,
} from './sequencer-redux'
import {
	addMultiThing, BROADCASTER_ACTION, createSequencerEvents, IClientRoomState,
	IMultiState, IMultiStateThings, isEmptyEvents, makeMultiReducer, NetworkActionType,
	selectGlobalClockState, SERVER_ACTION, IClientAppState,
} from '.'

export const addBetterSequencer = (betterSequencer: BetterSequencerState) =>
	addMultiThing(betterSequencer, ConnectionNodeType.betterSequencer, NetworkActionType.SERVER_AND_BROADCASTER)

export const betterSequencerActions = {
	setNote: (betterSequencerId: Id, index: number, enabled: boolean, note: IMidiNote) => ({
		type: 'SET_BETTER_SEQUENCER_NOTE',
		id: betterSequencerId,
		index,
		enabled,
		note,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	restart: (id: Id) => ({
		type: 'RESTART_BETTER_SEQUENCER',
		id,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	setField: (id: Id, fieldName: BetterSequencerFields, data: any) => ({
		type: 'SET_BETTER_SEQUENCER_FIELD',
		id,
		fieldName,
		data,
		...getNetworkActionThings(fieldName),
	} as const),
} as const

function getNetworkActionThings(fieldName: BetterSequencerFields) {
	if ([
		BetterSequencerFields.gate,
		BetterSequencerFields.scrollY,
		BetterSequencerFields.pitch,
		BetterSequencerFields.rate,
	].includes(fieldName)) {
		return {SERVER_ACTION, BROADCASTER_ACTION}
	} else {
		return {}
	}
}

export enum BetterSequencerFields {
	gate = 'gate',
	scrollY = 'scrollY',
	index = 'index',
	pitch = 'pitch',
	rate = 'rate',
}

export interface IBetterSequencersState extends IMultiState {
	things: IBetterSequencers
}

export interface IBetterSequencers extends IMultiStateThings {
	[key: string]: BetterSequencerState
}

export class BetterSequencerState extends SequencerStateBase {
	public static dummy = new BetterSequencerState(
		'dummy', 'dummy', List(), false,
	)

	public constructor(
		ownerId: Id,
		name = 'Better Sequencer',
		events = createSequencerEvents(32)
			.map((_, i) => (makeMidiClipEvent({
				notes: MidiNotes([i + 60]),
				startBeat: i / 2,
				durationBeats: i % 4 === 0 ? 2 : 1,
			}))),
		isPlaying = true,
	) {

		super(
			name,
			new MidiClip({
				events: events.map(x => ({
					...x,
					startBeat: x.startBeat,
					durationBeats: x.durationBeats,
				})),
				length: 4 * 8,
				loop: true,
			}),
			ownerId,
			ConnectionNodeType.betterSequencer,
			true,
			1,
			1,
			{x: 2, y: 10},
			{x: 0, y: 1550},
		)
	}
}

export function deserializeBetterSequencerState(state: IMultiStateThing): IMultiStateThing {
	const x = state as BetterSequencerState
	const z = deserializeSequencerState(x)
	const y: BetterSequencerState = {
		...(new BetterSequencerState(x.ownerId)),
		...z,
	}
	return y
}

type BetterSequencerActionTypes = {
	[key in BetterSequencerAction['type']]: 0
}

const betterSequencerActionTypes2: BetterSequencerActionTypes = {
	SET_BETTER_SEQUENCER_NOTE: 0,
	SET_BETTER_SEQUENCER_FIELD: 0,
	CLEAR_SEQUENCER: 0,
	UNDO_SEQUENCER: 0,
	PLAY_SEQUENCER: 0,
	STOP_SEQUENCER: 0,
	TOGGLE_SEQUENCER_RECORDING: 0,
	RECORD_SEQUENCER_NOTE: 0,
	EXPORT_SEQUENCER_MIDI: 0,
	PLAY_ALL: 0,
	RECORD_SEQUENCER_REST: 0,
	RESTART_BETTER_SEQUENCER: 0,
	SKIP_NOTE: 0,
	STOP_ALL: 0,
	SET_SEQUENCER_ZOOM: 0,
	SET_SEQUENCER_PAN: 0,
}

const betterSequencerActionTypes = Object.keys(betterSequencerActionTypes2)

assertArrayHasNoUndefinedElements(betterSequencerActionTypes)

const betterSequencerGlobalActionTypes = [
	'PLAY_ALL',
	'STOP_ALL',
]

assertArrayHasNoUndefinedElements(betterSequencerGlobalActionTypes)

export type BetterSequencerAction = SequencerAction | ActionType<typeof betterSequencerActions>

const betterSequencerReducer =
	(betterSequencer: BetterSequencerState, action: BetterSequencerAction): BetterSequencerState => {
		switch (action.type) {
			case 'SET_BETTER_SEQUENCER_NOTE':
				if (action.note === undefined) {
					throw new Error('action.notes === undefined')
				}
				return {
					...betterSequencer,
					midiClip: betterSequencer.midiClip.set('events', betterSequencer.midiClip.events.map((event, eventIndex) => {
						if (eventIndex === action.index) {
							if (action.enabled) {
								return {
									...event,
									notes: event.notes.add(action.note),
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
					})),
					previousEvents: betterSequencer.previousEvents.unshift(betterSequencer.midiClip.events),
				}
			case 'SET_BETTER_SEQUENCER_FIELD':
				if (action.fieldName === 'index') {
					return {
						...betterSequencer,
						[action.fieldName]: action.data % betterSequencer.midiClip.events.count(),
					}
				} else {
					return {
						...betterSequencer,
						[action.fieldName]: action.data,
					}
				}
			case 'SET_SEQUENCER_ZOOM': {
				return {
					...betterSequencer,
					zoom: action.zoom,
				}
			}
			case 'SET_SEQUENCER_PAN': {
				return {
					...betterSequencer,
					pan: action.pan,
				}
			}
			case 'TOGGLE_SEQUENCER_RECORDING': return {...betterSequencer, isRecording: action.isRecording}
			case 'UNDO_SEQUENCER': {
				if (betterSequencer.previousEvents.count() === 0) return betterSequencer

				const prv = Stack(betterSequencer.previousEvents)

				return {
					...betterSequencer,
					midiClip: betterSequencer.midiClip.set('events', prv.first()),
					previousEvents: prv.shift().toList(),
				}
			}
			case 'CLEAR_SEQUENCER': {
				if (isEmptyEvents(betterSequencer.midiClip.events)) return betterSequencer

				return {
					...betterSequencer,
					midiClip: betterSequencer.midiClip.set(
						'events',
						createSequencerEvents(betterSequencer.midiClip.events.count(), 1),
					),
					previousEvents: betterSequencer.previousEvents.unshift(betterSequencer.midiClip.events),
				}
			}
			case 'RECORD_SEQUENCER_NOTE':
				const index = action.index
				if (index === undefined) return betterSequencer
				if (betterSequencer.isRecording) {
					return {
						...betterSequencer,
						midiClip: betterSequencer.midiClip.withMutations(mutable => {
							mutable.set('events',
								mutable.events.update(
									index,
									x => ({...x, notes: x.notes.add(action.note)})))
						}),
						previousEvents: betterSequencer.previousEvents.unshift(betterSequencer.midiClip.events),
					}
				} else {
					return betterSequencer
				}
			case 'PLAY_SEQUENCER': return {...betterSequencer, isPlaying: true}
			case 'STOP_SEQUENCER': return {...betterSequencer, isPlaying: false, isRecording: false}
			case 'PLAY_ALL': return {...betterSequencer, isPlaying: true}
			case 'STOP_ALL': return {...betterSequencer, isPlaying: false, isRecording: false}
			default:
				return betterSequencer
		}
	}

export const betterSequencersReducer =
	makeMultiReducer<BetterSequencerState, IBetterSequencersState>(
		betterSequencerReducer, ConnectionNodeType.betterSequencer,
		betterSequencerActionTypes, betterSequencerGlobalActionTypes,
	)

export const selectAllBetterSequencerIds = createSelector(
	selectAllBetterSequencers,
	betterSequencers => Object.keys(betterSequencers),
)

export const selectBetterSequencer = (state: IClientRoomState, id: Id) =>
	selectAllBetterSequencers(state)[id as string] || BetterSequencerState.dummy

export const createBetterSeqIsRecordingSelector = (id: Id) => (state: IClientAppState) =>
	selectBetterSequencer(state.room, id).isRecording

export const createBetterSeqIsPlayingSelector = (id: Id) => (state: IClientAppState) =>
	selectBetterSequencer(state.room, id).isPlaying

export const createBetterSeqRateSelector = (id: Id) => (state: IClientAppState) =>
	selectBetterSequencer(state.room, id).rate

export const createBetterSeqLengthSelector = (id: Id) => (state: IClientAppState) =>
	selectBetterSequencer(state.room, id).midiClip.length

export const createBetterSeqZoomSelector = (id: Id) => (state: IClientAppState) =>
	selectBetterSequencer(state.room, id).zoom

export const createBetterSeqPanSelector = (id: Id) => (state: IClientAppState) =>
	selectBetterSequencer(state.room, id).pan

export const createBetterSeqMidiClipSelector = (id: Id) => (state: IClientAppState) =>
	selectBetterSequencer(state.room, id).midiClip

export const selectBetterSequencerEvents = (state: IClientRoomState, id: Id) =>
	selectBetterSequencer(state, id).midiClip.events

export const selectBetterSequencerIsActive = (state: IClientRoomState, id: Id) =>
	selectBetterSequencer(state, id).isPlaying

export const selectBetterSequencerIsSending = (state: IClientRoomState, id: Id) =>
	selectBetterSequencerActiveNotes(state, id).count() > 0

export const selectBetterSequencerActiveNotes = createSelector(
	[selectBetterSequencer, selectGlobalClockState],
	(betterSequencer, globalClockState) => {
		if (!betterSequencer) return emptyMidiNotes
		if (!betterSequencer.isPlaying) return emptyMidiNotes

		const globalClockIndex = globalClockState.index

		const index = globalClockIndex

		if (index >= 0 && betterSequencer.midiClip.events.count() > 0) {
			return betterSequencer.midiClip.events.get(index % betterSequencer.midiClip.events.count())!.notes
		} else {
			return emptyMidiNotes
		}
	},
)
