import {logger} from '../common/logger'
import {IMidiNotes} from '../common/MidiNote'

export enum SimpleGridSequencerEventAction {
	playNote,
	stopNote,
	endGridSequencer,
}

export interface ISimpleGridSequencerEvent {
	time: number
	action: SimpleGridSequencerEventAction
	notes?: IMidiNotes
}

export type IndexChangeHandler = (newIndex: number) => any

export class GridSequencerPlayer {
	private readonly _audioContext: AudioContext
	private _index: number = 0
	private _startTime: number
	private _isPlaying: boolean = false
	private readonly _onIndexChange: IndexChangeHandler

	constructor(audioContext: AudioContext, onIndexChange: IndexChangeHandler) {
		this._audioContext = audioContext
		this._onIndexChange = onIndexChange
		this._startTime = this._audioContext.currentTime
	}

	public readonly play = () => {
		logger.debug('GridSequencerPlayer play')
		if (this.isPlaying()) return
		this._startTime = this._audioContext.currentTime
		this._isPlaying = true
		window.requestAnimationFrame(this._onTick)
	}

	public readonly restart = () => {
		logger.debug('GridSequencerPlayer restart')
		if (!this.isPlaying()) return this.play()

		this._startTime = this._audioContext.currentTime
	}

	public readonly stop = () => {
		logger.debug('GridSequencerPlayer stop')
		if (this._isPlaying === false) return
		this._isPlaying = false
		this._index = 0
		this._onIndexChange(-1)
	}

	public readonly getCurrentPlayTime = () => this._audioContext.currentTime - this._startTime

	public readonly isPlaying = () => this._isPlaying

	private readonly _onTick: FrameRequestCallback = () => {
		this._doTick()

		if (this._isPlaying) {
			window.requestAnimationFrame(this._onTick)
		}
	}

	private readonly _doTick = () => {
		const newIndex = Math.floor(this.getCurrentPlayTime() * 5)

		if (newIndex !== this._index) {
			if (newIndex - this._index > 1) {
				logger.warn('newIndex was more than 1 off of this._index: ', newIndex - this._index)
			}

			this._index = newIndex

			if (this._isPlaying) {
				this._onIndexChange(this._index)
			}
		}
	}
}
