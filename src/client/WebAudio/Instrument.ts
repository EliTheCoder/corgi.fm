import {Set} from 'immutable'
import {IDisposable} from '../../common/common-types'
import {logger} from '../../common/logger'
import {emptyMidiNotes, IMidiNote, IMidiNotes} from '../../common/MidiNote'
import {AudioNodeWrapper, IAudioNodeWrapperOptions, registerInstrumentWithSchedulerVisual, Voice, Voices} from './index'

export abstract class Instrument<T extends Voices<V>, V extends Voice> extends AudioNodeWrapper implements IDisposable {

	protected readonly _panNode: StereoPannerNode
	protected readonly _audioContext: AudioContext
	protected readonly _lowPassFilter: BiquadFilterNode
	protected _attackTimeInSeconds: number = 0.01
	protected _decayTimeInSeconds: number = 0.25
	protected _sustain: number = 0.8
	protected _releaseTimeInSeconds: number = 3
	protected _detune: number
	private readonly _gain: GainNode
	private _previousNotes = emptyMidiNotes

	constructor(options: IInstrumentOptions) {
		super(options)

		this._audioContext = options.audioContext

		this._panNode = this._audioContext.createStereoPanner()

		this._lowPassFilter = this._audioContext.createBiquadFilter()
		this._lowPassFilter.type = 'lowpass'
		this._lowPassFilter.frequency.value = 10000

		this._gain = this._audioContext.createGain()
		// Just below 1 to help mitigate an infinite feedback loop
		this._gain.gain.value = 1

		this._detune = options.detune

		this._panNode.connect(this._lowPassFilter)
		this._lowPassFilter.connect(this._gain)

		registerInstrumentWithSchedulerVisual(this.id, () => this._getVoices().getScheduledVoices(), this._audioContext)
	}

	public scheduleNote(note: IMidiNote, delaySeconds: number, invincible: boolean, sourceIds: Set<string>) {
		this._getVoices().scheduleNote(note, delaySeconds, this._attackTimeInSeconds, this._decayTimeInSeconds, this._sustain, invincible, sourceIds)
	}

	public scheduleRelease(note: number, delaySeconds: number) {
		this._getVoices().scheduleRelease(note, delaySeconds, this._releaseTimeInSeconds)
	}

	public releaseAllScheduled() {
		this._getVoices().releaseAllScheduled(this._releaseTimeInSeconds)
	}

	public releaseAllScheduledFromSourceId(sourceId: string) {
		this._getVoices().releaseAllScheduledFromSourceId(this._releaseTimeInSeconds, sourceId)
	}

	public readonly getInputAudioNode = () => null
	public readonly getOutputAudioNode = () => this._gain

	public readonly setPan = (pan: number) => {
		// Rounding to nearest to 32 bit number because AudioParam values are 32 bit floats
		const newPan = Math.fround(pan)
		if (newPan === this._panNode.pan.value) return
		this._panNode.pan.setValueAtTime(newPan, this._audioContext.currentTime)
	}

	public readonly setLowPassFilterCutoffFrequency = (frequency: number) => {
		// Rounding to nearest to 32 bit number because AudioParam values are 32 bit floats
		const newFreq = Math.fround(frequency)
		if (newFreq === this._lowPassFilter.frequency.value) return
		this._lowPassFilter.frequency.linearRampToValueAtTime(newFreq, this._audioContext.currentTime + 0.004)
	}

	// TODO Check if changed before iterating through previous notes
	public readonly setMidiNotes = (midiNotes: IMidiNotes) => {
		const newNotes = midiNotes.filter(x => this._previousNotes.includes(x) === false)
		const offNotes = this._previousNotes.filter(x => midiNotes.includes(x) === false)

		offNotes.forEach(note => {
			this._getVoices().releaseNote(note, this._releaseTimeInSeconds)
		})

		newNotes.forEach(note => {
			this._getVoices().playNote(note, this._attackTimeInSeconds)
		})

		this._previousNotes = midiNotes
	}

	public readonly setAttack = (attackTimeInSeconds: number) => {
		if (this._attackTimeInSeconds === attackTimeInSeconds) return
		this._attackTimeInSeconds = attackTimeInSeconds
		this._getVoices().changeAttackLengthForScheduledVoices(this._attackTimeInSeconds)
	}

	public readonly setDecay = (decayTimeInSeconds: number) => {
		if (this._decayTimeInSeconds === decayTimeInSeconds) return
		this._decayTimeInSeconds = decayTimeInSeconds
		// TODO?
		// this._getVoices().changeDecayLengthForScheduledVoices(this._decayTimeInSeconds)
	}

	public readonly setSustain = (sustain: number) => {
		if (this._sustain === sustain) return
		this._sustain = sustain
		// TODO?
		// this._getVoices().changeSustainLengthForScheduledVoices(this._sustain)
	}

	public readonly setRelease = (releaseTimeInSeconds: number) => this._releaseTimeInSeconds = releaseTimeInSeconds

	public setDetune = (detune: number) => {
		if (detune === this._detune) return
		this._detune = detune
		this._getVoices().setDetune(detune)
	}

	public setGain(gain: number) {
		// Rounding to nearest to 32 bit number because AudioParam values are 32 bit floats
		const newGain = Math.fround(gain)
		if (newGain === this._gain.gain.value) return
		this._gain.gain.linearRampToValueAtTime(newGain, this._audioContext.currentTime + 0.004)
	}

	public readonly getActivityLevel = () => this._getVoices().getActivityLevel()

	public dispose = () => {
		this._getVoices().dispose()

		this._dispose()
	}

	protected _dispose = () => {
		this._panNode.disconnect()
		this._gain.disconnect()
		this._lowPassFilter.disconnect()
	}

	protected abstract _getVoices(): T
}

export interface IInstrumentOptions extends IAudioNodeWrapperOptions {
	voiceCount: number
	detune: number
	forScheduling: boolean
}
