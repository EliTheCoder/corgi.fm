import {CssColor} from '@corgifm/common/shamu-color'
import {
	ExpNodeAudioOutputPort, ExpPort,
} from '../ExpPorts'
import {CorgiNode, CorgiNodeArgs} from '../CorgiNode'
import {logger} from '../../client-logger'
import {ExpMidiOutputPort} from '../ExpMidiPorts'
import {PolyphonicGroupNode} from './PolyphonicGroupNode'

export class PolyphonicGroupInputNode extends CorgiNode {
	protected readonly _ports = new Map<Id, ExpPort>()
	private readonly _parentPolyGroupNode?: PolyphonicGroupNode

	public constructor(corgiNodeArgs: CorgiNodeArgs) {
		super(corgiNodeArgs, {name: 'Polyphonic Group Input', color: CssColor.blue})

		if (this._parentNode === undefined) {
			logger.error('[PolyphonicGroupInputNode] expected a parent node!', {this: this, parent: this._parentNode})
			return
		}

		if (!(this._parentNode instanceof PolyphonicGroupNode)) {
			logger.error('[PolyphonicGroupInputNode] expected parent to be a PolyphonicGroupNode!', {this: this, parent: this._parentNode})
			return
		}

		this._parentPolyGroupNode = this._parentNode

		this._parentPolyGroupNode.registerChildInputNode().forEach(([input, source]) => {
			this._ports.set(input.id, new ExpNodeAudioOutputPort(input.id, input.name, this, source))
		})

		// const pitchGain = corgiNodeArgs.audioContext.createGain()
		// const internalPitchPort = new ExpNodeAudioOutputPort('pitch', 'pitch', this, pitchGain)
		// this._ports.set(internalPitchPort.id, internalPitchPort)

		// const internalMidiPort = new ExpMidiOutputPort('gate', 'gate', this)
		// this._ports.set(internalMidiPort.id, internalMidiPort)
	}

	public render = () => this.getDebugView()

	protected _enable = () => {}
	protected _disable = () => {}

	protected _dispose() {
	}
}
