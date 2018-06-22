import classnames from 'classnames'
import {Component} from 'react'
import * as React from 'react'
import {connect} from 'react-redux'
import ReactSVG from 'react-svg'
import {Dispatch} from 'redux'
import {IMidiNote} from '../../common/MidiNote'
import {
	createBasicInstrument, selectInstrumentByOwner, setBasicInstrumentOscillatorType,
} from '../../common/redux/basic-instruments-redux'
import {IAppState} from '../../common/redux/configureStore'
import {makeGetMidiOutputByOwner} from '../../common/redux/virtual-keyboard-redux'
import {audioContext, preFx} from '../setup-audio-context'
import {Knob} from '../Volume/Knob'
import {ClientId} from '../websocket-listeners'
import {BasicInstrument} from './BasicInstrument'
import './BasicInstrumentView.less'
import SawWave from './SawWave.svg'
import SineWave from './SineWave.svg'
import SquareWave from './SquareWave.svg'

export type MidiNotes = IMidiNote[]

interface IBasicInstrumentViewProps {
	color?: string
	brightColor?: string
	rawMidiNotes?: MidiNotes
	ownerId: ClientId
	pan?: number
	isPlaying?: boolean
	oscillatorType?: OscillatorType
	createBasicInstrument?: () => any
	changeOscillatorType: (ownerId, type) => any
	dispatch: Dispatch
}

const oscillatorTypes = [
	{type: 'sine', svgPath: SineWave},
	{type: 'square', svgPath: SquareWave},
	{type: 'sawtooth', svgPath: SawWave},
]

export class BasicInstrumentView extends Component<IBasicInstrumentViewProps> {
	public static defaultProps = {
		pan: 0,
		rawMidiNotes: [],
		color: 'gray',
		brightColor: 'lightgray',
	}

	private instrument: BasicInstrument

	constructor(props) {
		super(props)
		props.dispatch(createBasicInstrument(props.ownerId))
		this.instrument = new BasicInstrument({
			audioContext,
			destination: preFx,
		})
		this.instrument.setPan(props.pan)
	}

	public componentWillUnmount() {
		this.instrument.dispose()
	}

	public shouldComponentUpdate(nextProps) {
		if (this.props.color !== nextProps.color) return true
		if (this.props.brightColor !== nextProps.brightColor) return true
		if (this.props.rawMidiNotes.length !== nextProps.rawMidiNotes.length) return true
		if (this.props.rawMidiNotes.toString() !== nextProps.rawMidiNotes.toString()) return true
		if (this.props.ownerId !== nextProps.ownerId) return true
		if (this.props.pan !== nextProps.pan) return true
		if (this.props.isPlaying !== nextProps.isPlaying) return true
		if (this.props.oscillatorType !== nextProps.oscillatorType) return true
		return false
	}

	public render() {
		const {color, brightColor, isPlaying, pan, rawMidiNotes, oscillatorType} = this.props

		this.instrument.setMidiNotes(rawMidiNotes)
		this.instrument.setOscillatorType(oscillatorType)

		return (
			<div className="isometricBoxShadow" style={{color: isPlaying ? brightColor : color}}>
				<div className={classnames(['basicInstrument', isPlaying ? 'isPlaying' : 'isNotPlaying'])} >
					<div className="label">basic instrument</div>

					<Knob min={-1} max={1} value={pan} label="pan" readOnly={true} />

					<BasicInstrumentOscillatorTypes
						handleClick={this._handleOscillatorTypeClicked}
						activeType={oscillatorType}
					/>
				</div >
			</div>
		)
	}

	private _handleOscillatorTypeClicked = (type: OscillatorType) => {
		this.props.dispatch(setBasicInstrumentOscillatorType(this.props.ownerId, type))
	}
}

interface IBasicInstrumentOscillatorTypesProps {
	handleClick: (type: OscillatorType) => void
	activeType: OscillatorType
}

class BasicInstrumentOscillatorTypes extends Component<IBasicInstrumentOscillatorTypesProps> {
	public shouldComponentUpdate(nextProps) {
		if (this.props.activeType !== nextProps.activeType) return true
		return false
	}

	public render() {
		const {activeType, handleClick} = this.props

		return (
			<div className="oscillatorTypes">
				{oscillatorTypes.map(({type, svgPath}) =>
					<div key={type} onClick={handleClick.bind(undefined, type)}>
						<ReactSVG
							path={svgPath}
							className={activeType === type ? 'active' : undefined}
						/>
					</div>,
				)}
			</div>
		)
	}
}

const makeMapStateToProps = () => {
	const getMidiOutputByOwner = makeGetMidiOutputByOwner()

	return (state: IAppState, props: IBasicInstrumentViewProps) => {
		const rawMidiNotes = props.ownerId ? getMidiOutputByOwner(state, props) : []
		const instrumentState = selectInstrumentByOwner(state, props.ownerId)

		return {
			rawMidiNotes,
			isPlaying: rawMidiNotes.length > 0,
			oscillatorType: instrumentState && instrumentState.oscillatorType,
		}
	}
}

export const ConnectedBasicInstrumentView = connect(
	makeMapStateToProps,
)(BasicInstrumentView)
