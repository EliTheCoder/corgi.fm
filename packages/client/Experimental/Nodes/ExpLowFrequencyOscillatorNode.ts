import {CssColor} from '@corgifm/common/shamu-color'
import {lfoFreqCurveFunctions, arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {
	lfoRateValueToString, detuneValueToString, percentageValueString,
} from '../../client-constants'
import {
	ExpNodeAudioOutputPort, ExpNodeAudioParamInputPort, ExpPorts,
} from '../ExpPorts'
import {ExpAudioParam, ExpAudioParams, ExpCustomEnumParams, ExpCustomEnumParam} from '../ExpParams'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {ToggleGainChain} from './NodeHelpers/ToggleGainChain'
import {LabGain, LabAudioBufferSourceNode} from './PugAudioNode/Lab'
import {ExpMidiInputPort} from '../ExpMidiPorts'
import {MidiAction} from '@corgifm/common/common-types'

const oscillatorTypes = ['sawtooth', 'sine', 'triangle', 'square'] as const
type OscillatorType = typeof oscillatorTypes[number]

const pulseOptions = ['retrigger', 'idle'] as const
type PulseMode = typeof pulseOptions[number]

export class LowFrequencyOscillatorExpNode extends CorgiNode {
	protected readonly _ports: ExpPorts
	protected readonly _audioParams: ExpAudioParams
	protected readonly _customEnumParams: ExpCustomEnumParams
	private readonly _bufferSource: LabAudioBufferSourceNode
	private readonly _dummyGain: LabGain
	private readonly _gain: LabGain
	private readonly _outputChain: ToggleGainChain
	private readonly _type: ExpCustomEnumParam<OscillatorType>
	private readonly _pulseMode: ExpCustomEnumParam<PulseMode>

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Low Frequency Oscillator', color: CssColor.purple})

		this._type = new ExpCustomEnumParam<OscillatorType>('type', 'sine', oscillatorTypes)
		this._pulseMode = new ExpCustomEnumParam<PulseMode>('mode', 'idle', ['retrigger'])
		this._customEnumParams = arrayToESIdKeyMap([this._type, this._pulseMode] as ExpCustomEnumParam<string>[])

		this._bufferSource = new LabAudioBufferSourceNode({...corgiNodeArgs, voiceMode: 'autoPoly', creatorName: 'LowFrequencyOscillatorExpNode'})
		this._bufferSource.loop = true
		this._bufferSource.loopEnd = 1
		this._bufferSource.playbackRate.onMakeVoice = rate => rate.setValueAtTime(0, 0)

		this._gain = new LabGain({...corgiNodeArgs, voiceMode: 'autoPoly', creatorName: 'LowFrequencyOscillatorExpNode-_gain'})
		this._gain.gain.onMakeVoice = gain => gain.setValueAtTime(0, 0)

		this._dummyGain = new LabGain({...corgiNodeArgs, voiceMode: 'autoPoly', creatorName: 'LowFrequencyOscillatorExpNode-_dummyGain'})
		this._dummyGain.gain.onMakeVoice = gain => gain.setValueAtTime(0, 0)

		this._outputChain = new ToggleGainChain(corgiNodeArgs.audioContext)

		this._dummyGain.connect(this._bufferSource.playbackRate)

		this._bufferSource
			.connect(this._gain)
			.connect(this._outputChain.input)

		const frequencyParam = new ExpAudioParam('frequency', this._bufferSource.playbackRate, 1, 32, 'unipolar', {valueString: lfoRateValueToString, curveFunctions: lfoFreqCurveFunctions})
		const detuneParam = new ExpAudioParam('detune', this._bufferSource.detune, 0, 100, 'bipolar', {valueString: detuneValueToString})
		const gainParam = new ExpAudioParam('gain', this._gain.gain, 1, 1, 'unipolar', {valueString: percentageValueString})
		this._audioParams = arrayToESIdKeyMap([frequencyParam, detuneParam, gainParam])

		const midiInputPort = new ExpMidiInputPort('retrigger', 'retrigger', this, this._onMidiMessage)
		const frequencyPort = new ExpNodeAudioParamInputPort(frequencyParam, this, corgiNodeArgs, 'offset')
		const detunePort = new ExpNodeAudioParamInputPort(detuneParam, this, corgiNodeArgs, 'center')
		const gainPort = new ExpNodeAudioParamInputPort(gainParam, this, corgiNodeArgs, 'offset')
		const outputPort = new ExpNodeAudioOutputPort('output', 'output', this, this._outputChain.output)
		this._ports = arrayToESIdKeyMap([midiInputPort, frequencyPort, detunePort, gainPort, outputPort])

		this._type.onChange.subscribe(this.onTypeChange)
		this._pulseMode.onChange.subscribe(this._onPulse)
	}

	public render = () => this.getDebugView()

	protected _enable = () => this._outputChain.enable()
	protected _disable = () => this._outputChain.disable()

	protected _dispose() {
		this._outputChain.dispose(() => {
			this._bufferSource.dispose()
			this._gain.dispose()
		})
	}

	private readonly onTypeChange = (type: OscillatorType) => {
		this._bufferSource.buffer = generateWave(type, this._audioContext)
	}

	private readonly _onPulse = (mode: PulseMode) => {
		if (mode !== 'idle') this._pulseMode.onChange.invokeNextFrame('idle')

		if (this._enabled && mode === 'retrigger') {
			this._bufferSource.retrigger(this._audioContext.currentTime)
			this._bufferSource.setActiveVoice('all', this._audioContext.currentTime)
		}
	}

	private readonly _onMidiMessage = (midiAction: MidiAction) => {
		if (midiAction.type === 'VOICE_COUNT_CHANGE') {
			// console.log('receiveMidiAction VOICE_COUNT_CHANGE', this, midiAction.newCount)
			this._dummyGain.setVoiceCount(midiAction.newCount)
		}
		if (!this._enabled) return

		if ((midiAction.type === 'MIDI_NOTE' || midiAction.type === 'MIDI_GATE') && midiAction.gate === true) {
			this._bufferSource.retrigger(midiAction.time, midiAction.voice)
			this._bufferSource.setActiveVoice(midiAction.voice, midiAction.time)
		}
	}
}

function generateWave(type: OscillatorType, audioContext: AudioContext): AudioBuffer {
	switch (type) {
		case "sawtooth": return generateSawtoothWaveBuffer(audioContext)
		case "sine": return generateSineWaveBuffer(audioContext)
		case "square": return generateSquareWaveBuffer(audioContext)
		case "triangle": return generateTriangleWaveBuffer(audioContext)
	}
}

function generateSineWaveBuffer(audioContext: AudioContext): AudioBuffer {
	const sampleRate = audioContext.sampleRate
	const lengthSeconds = 1
	const sampleCount = sampleRate * lengthSeconds

	const buffer = audioContext.createBuffer(1, sampleCount, sampleRate)

	const samples = new Float32Array(sampleCount)

	for (let i = 0; i < sampleCount; i++) {
		const time = i / sampleRate
		samples[i] = Math.sin(2 * Math.PI * time)
	}

	buffer.copyToChannel(samples, 0)

	return buffer
}

function generateTriangleWaveBuffer(audioContext: AudioContext): AudioBuffer {
	const sampleRate = audioContext.sampleRate
	const lengthSeconds = 1
	const sampleCount = sampleRate * lengthSeconds

	const buffer = audioContext.createBuffer(1, sampleCount, sampleRate)

	const samples = new Float32Array(sampleCount)

	for (let i = 0; i < sampleCount; i++) {
		const time = i / sampleRate
		samples[i] = (-Math.abs((4 * time) - 2)) + 1
	}

	buffer.copyToChannel(samples, 0)

	return buffer
}

function generateSawtoothWaveBuffer(audioContext: AudioContext): AudioBuffer {
	const sampleRate = audioContext.sampleRate
	const lengthSeconds = 1
	const sampleCount = sampleRate * lengthSeconds

	const buffer = audioContext.createBuffer(1, sampleCount, sampleRate)

	const samples = new Float32Array(sampleCount)

	for (let i = 0; i < sampleCount; i++) {
		const time = i / sampleRate
		samples[i] = (2 * time) - 1
	}

	buffer.copyToChannel(samples, 0)

	return buffer
}

function generateSquareWaveBuffer(audioContext: AudioContext): AudioBuffer {
	const sampleRate = audioContext.sampleRate
	const lengthSeconds = 1
	const sampleCount = sampleRate * lengthSeconds

	const buffer = audioContext.createBuffer(1, sampleCount, sampleRate)

	const samples = new Float32Array(sampleCount)

	for (let i = 0; i < sampleCount; i++) {
		const time = i / sampleRate
		samples[i] = (time % 1) > 0.5 ? -1 : 1
	}

	buffer.copyToChannel(samples, 0)

	return buffer
}
