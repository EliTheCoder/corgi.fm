import {LabAudioNode, LabGain} from '../PugAudioNode/Lab'

export class ToggleGainChain {
	public get input(): LabAudioNode {return this._inputGain}
	public get output(): LabAudioNode {return this._outputGain}
	private readonly _inputGain: LabGain
	private readonly _outputGain: LabGain

	public constructor(
		_audioContext: AudioContext,
		startRampSpeed = 0.005,
	) {
		this._inputGain = new LabGain({audioContext: _audioContext, voiceMode: 'autoPoly', creatorName: 'ToggleGainChain'})
		this._inputGain.gain.onMakeVoice = voice =>	voice.setTargetAtTime(1, 0, 0.005)

		this._outputGain = new LabGain({audioContext: _audioContext, voiceMode: 'autoPoly', creatorName: 'ToggleGainChain'})
		this._outputGain.gain.onMakeVoice = voice => voice.setTargetAtTime(1, 0.5, startRampSpeed)

		this._inputGain.connect(this._outputGain)
	}

	public enable() {
		this._inputGain.gain.onMakeVoice = voice =>	voice.setTargetAtTime(1, 0, 0.005)
	}

	public disable() {
		this._inputGain.gain.onMakeVoice = voice =>	voice.setTargetAtTime(0, 0, 0.005)
	}

	public dispose(callback?: () => void) {
		this._outputGain.gain.onMakeVoice = voice => voice.setTargetAtTime(0, 0, 0.005)

		setTimeout(() => {
			this._inputGain.disconnect()
			this._outputGain.disconnect()
			if (callback) callback()
		}, 50)
	}
}
