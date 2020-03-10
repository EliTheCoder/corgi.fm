import React from 'react'
import * as uuid from 'uuid'
import * as Immutable from 'immutable'
import {CssColor} from '@corgifm/common/shamu-color'
import {arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {
	preciseSubtract, preciseAdd, makeExpMidiClip,
	makeExpMidiEventsFromArray, ExpMidiClip, makeExpMidiNoteEvent,
	preciseRound, preciseCeil, convertExpMidiEventsToSequencerEvents, MidiRange,
} from '@corgifm/common/midi-types'
import {midiActions} from '@corgifm/common/common-types'
import {logger} from '../../client-logger'
import {
	ExpCustomNumberParam, ExpCustomNumberParams, ExpMidiClipParams,
	ExpMidiClipParam, ExpButtons, ExpButton,
} from '../ExpParams'
import {ExpMidiOutputPort} from '../ExpMidiPorts'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {ExpPorts} from '../ExpPorts'
import {ExpSequencerNodeExtra} from './ExpSequencerNodeView'
import {EventStreamReader, myPrecision, songOfTime} from './EventStreamStuff'
import {SeqPatternView, SeqPattern, SeqEvent, SeqNoteEvent, seqPatternViewReader} from './SeqStuff'

// not sure if needed?
// causes problems with range 0 and repeating notes on start
const _jumpStartSeconds = 0.0

export class SequencerNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	protected readonly _customNumberParams: ExpCustomNumberParams
	protected readonly _buttons: ExpButtons
	private readonly _restartButton: ExpButton
	private readonly _tempo: ExpCustomNumberParam
	private readonly _midiOutputPort: ExpMidiOutputPort
	private _songStartTimeSeconds = -1
	private _cursorBeats = 0
	private readonly _patternView: SeqPatternView
	private readonly _pattern: SeqPattern
	private _justStarted = false
	private lastAudioContextTime = -1
	private currentSongTimeBeats = 0
	private _cursorSeconds = 0

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Sequencer', color: CssColor.yellow})

		const events: readonly SeqNoteEvent[] = [{
			id: uuid.v4(),
			active: true,
			startBeat: 0,
			type: 'note',
			duration: 0.5,
			velocity: 1,
			note: 60,
		}, {
			id: uuid.v4(),
			active: true,
			startBeat: 0.5,
			type: 'note',
			duration: 1,
			velocity: 1,
			note: 72,
		}, {
			id: uuid.v4(),
			active: true,
			startBeat: 1.5,
			type: 'note',
			duration: 1,
			velocity: 1,
			note: 67,
		}]

		this._pattern = {
			id: uuid.v4(),
			events: Immutable.Map<Id, SeqEvent>(arrayToESIdKeyMap(events))
		}

		this._patternView = {
			id: uuid.v4(),
			startBeat: 0,
			endBeat: 4,
			loopStartBeat: 0,
			loopEndBeat: 4,
			pattern: this._pattern,
		}

		this._midiOutputPort = new ExpMidiOutputPort('output', 'output', this)
		this._ports = arrayToESIdKeyMap([this._midiOutputPort])

		this._tempo = new ExpCustomNumberParam('tempo', 240, 0.001, 999.99, 3)
		this._customNumberParams = arrayToESIdKeyMap([this._tempo])

		this._restartButton = new ExpButton('restart', this)
		this._buttons = arrayToESIdKeyMap([this._restartButton])

		this._restartButton.onPress.subscribe(this._onRestartPress)
	}

	public render = () => {
		return this.getDebugView()
	}

	protected _enable() {
	}

	protected _disable() {
		this._songStartTimeSeconds = -1
	}

	protected _dispose() {
	}

	private readonly _onRestartPress = () => {
		this._songStartTimeSeconds = -1
	}

	public onTick(currentGlobalTime: number, maxReadAheadSeconds: number) {
		super.onTick(currentGlobalTime, maxReadAheadSeconds)

		if (!this._enabled) return

		const currentAudioContextTime = currentGlobalTime

		if (this._songStartTimeSeconds < 0) {
			// this._songStartTimeSeconds = Math.ceil((currentGlobalTime + 0.1) * 10) / 10
			this._justStarted = true
			this._songStartTimeSeconds = currentAudioContextTime
			// getAllAudioNodes().forEach(x => x.syncOscillatorStartTimes(songStartTimeSeconds, bpm))
			this.lastAudioContextTime = currentAudioContextTime
			this._cursorSeconds = 0
			this._cursorBeats = 0
		}

		// const {
		// 	isPlaying, bpm, maxReadAheadSeconds, playCount, startBeat,
		// } = selectGlobalClockState(roomState)

		const startBeat = 0

		const actualBPM = Math.max(0.000001, this._tempo.value)
		const toBeats = (x: number) => x * (actualBPM / 60)
		const fromBeats = (x: number) => x * (60 / actualBPM)

		// if (isPlaying !== _isPlaying) {
		// 	_isPlaying = isPlaying
		// 	logger.log('[note-scanner] isPlaying: ', isPlaying)
		// 	if (isPlaying) {
		// 		this._justStarted = true
		// 		this._songStartTimeSeconds = currentAudioContextTime
		// 		// getAllAudioNodes().forEach(x => x.syncOscillatorStartTimes(songStartTimeSeconds, bpm))
		// 	} else {
		// 		// song stopped
		// 		// release all notes on all instruments
		// 		// TODO
		// 		// releaseAllNotesOnAllInstruments(getAllInstruments)
		// 	}
		// }

		// if (isPlaying === false) return

		const currentSongTimeSeconds = currentAudioContextTime - this._songStartTimeSeconds
		const readToSongTimeSeconds = currentSongTimeSeconds + maxReadAheadSeconds
		// TODO Could be 0 or negative?
		const secondsToRead = readToSongTimeSeconds - this._cursorSeconds
		if (secondsToRead === 0) return
		logger.assert(secondsToRead > 0, 'no no no',
			{secondsToRead, readToSongTimeSeconds, cursorSeconds: this._cursorSeconds, currentSongTimeSeconds, maxReadAheadSeconds})
		const readFromBeat = this._cursorBeats
		const beatsToRead = toBeats(secondsToRead)


		// if (this._justStarted) {
		// 	this.currentSongTimeBeats = startBeat
		// 	this._cursorSeconds = startBeat
		// 	// _playCount = playCount
		// }

		// if playing
		// read from cursor to next cursor position
		// this._cursorSeconds = Math.max(this._cursorSeconds, this.currentSongTimeBeats)
		// const cursorDestinationBeats = this.currentSongTimeBeats + maxReadAheadSeconds
		// const minBeatsToRead = this._justStarted
		// 	? (toBeats(_jumpStartSeconds))
		// 	: 0
		// const beatsToRead = Math.max(minBeatsToRead, cursorDestinationBeats - this._cursorSeconds)

		// distance from currentSongTime to where the cursor just started reading events from
		const offsetSeconds = this._cursorSeconds - currentSongTimeSeconds

		const readRangeBeats = new MidiRange(readFromBeat, beatsToRead)

		const events = seqPatternViewReader(readRangeBeats, this._patternView)

		events.forEach(event => {
			const eventStartSeconds = currentAudioContextTime + offsetSeconds + fromBeats(event.offsetBeats)
			// console.log(event)
			// console.log({eventStartSeconds})
			if (event.type === 'noteOn') {
				this._midiOutputPort.sendMidiAction(midiActions.note(eventStartSeconds, true, event.note, event.velocity))
			} else if (event.type === 'noteOff') {
				this._midiOutputPort.sendMidiAction(midiActions.note(eventStartSeconds, false, event.note, 0))
			}
		})

		this._cursorSeconds = readToSongTimeSeconds
		this._cursorBeats += beatsToRead
		this._justStarted = false
	}
}
