import {LabAudioNode, LabGain} from '../PugAudioNode/Lab'

export class DryWetChain {
	public readonly inputGain: LabGain
	public readonly dryGain: LabGain
	public readonly wetGain: LabGain
	public readonly wetPostGain: LabGain
	public readonly outputGain: LabGain

	public constructor(
		audioContext: AudioContext,
		wetInternalNode: LabAudioNode,
		voiceMode: 'mono' | 'autoPoly',
		wetInternalOutputNode?: LabAudioNode,
	) {
		this.inputGain = new LabGain({audioContext, voiceMode, creatorName: 'DryWetChain'})
		this.dryGain = new LabGain({audioContext, voiceMode, creatorName: 'DryWetChain'})
		this.wetGain = new LabGain({audioContext, voiceMode, creatorName: 'DryWetChain'})
		this.wetPostGain = new LabGain({audioContext, voiceMode, creatorName: 'DryWetChain'})
		this.outputGain = new LabGain({audioContext, voiceMode, creatorName: 'DryWetChain'})

		this.inputGain
			.connect(this.dryGain)
			.connect(this.outputGain)
		this.inputGain
			.connect(this.wetGain)
			.connect(wetInternalNode);
		(wetInternalOutputNode || wetInternalNode)
			.connect(this.wetPostGain)
			.connect(this.outputGain)

		this.dryGain.gain.value = 0
		this.wetGain.gain.value = 1
	}

	public wetOnly() {
		this.dryGain.gain.value = 0
		this.wetGain.gain.value = 1
		this.wetPostGain.gain.value = 1
	}

	public dryOnly() {
		this.dryGain.gain.value = 1
		this.wetGain.gain.value = 0
		this.wetPostGain.gain.value = 0
	}

	public dispose() {
		this.inputGain.dispose()
		this.dryGain.dispose()
		this.wetGain.dispose()
		this.wetPostGain.dispose()
		this.outputGain.dispose()
	}
}
