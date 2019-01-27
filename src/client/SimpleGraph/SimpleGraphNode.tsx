import * as React from 'react'
import Draggable, {DraggableEventHandler} from 'react-draggable'
import {IoMdMenu} from 'react-icons/io'
import {Dispatch} from 'redux'
import {ConnectionNodeType} from '../../common/redux/node-types'
import {selectPosition, updatePosition} from '../../common/redux/positions-redux'
import {shamuConnect} from '../../common/redux/redux-utils'
import {CssColor} from '../../common/shamu-color'
import {ConnectedBasicSampler} from '../BasicSampler/BasicSampler'
import {ConnectedGridSequencerContainer} from '../GridSequencer/GridSequencerContainer'
import {ConnectedInfiniteSequencer} from '../InfiniteSequencer/InfiniteSequencer'
import {ConnectedBasicInstrumentView} from '../Instruments/BasicInstrumentView'
import {ConnectedKeyboard} from '../Keyboard/Keyboard'
import {ConnectedMasterControls} from '../MasterControls'
import {simpleGlobalClientState} from '../SimpleGlobalClientState'
import {ConnectedVolumeControl} from '../Volume/VolumeControl'

interface ISimpleGraphNodeProps {
	positionId: string
}

interface ISimpleGraphNodeReduxProps {
	x: number
	y: number
	targetType: ConnectionNodeType
	width: number
	height: number
}

type ISimpleGraphNodeAllProps = ISimpleGraphNodeProps & ISimpleGraphNodeReduxProps & {dispatch: Dispatch}

const handleClassName = 'handle'

export class SimpleGraphNode extends React.PureComponent<ISimpleGraphNodeAllProps> {
	public render() {
		const {x, y, width, height, positionId, targetType} = this.props

		return (
			// @ts-ignore: https://github.com/mzabriskie/react-draggable/issues/381
			<Draggable
				// onStart={this._handleStart}
				onDrag={this._handleDrag}
				// onStop={this._handleStop}
				position={{
					x,
					y,
				}}
				scale={simpleGlobalClientState.zoom}
				bounds={{
					top: -2000,
					right: 2000,
					bottom: 2000,
					left: -2000,
				}}
				handle={`.${handleClassName}`}
			>
				<div
					className="simpleGraphNode"
					style={{
						position: 'absolute',
						// backgroundColor: 'green',
						willChange: 'transform',
						width,
						height,
					}}
				>
					<Handle />
					{getComponentByNodeType(targetType, positionId)}
				</div>
			</Draggable >
		)
	}

	// private _handleStart: DraggableEventHandler = (e, data) =>
	// 	console.log('_handleStart: ', data)

	private _handleDrag: DraggableEventHandler = (e, data) => {
		this.props.dispatch(updatePosition(this.props.positionId, {x: data.x, y: data.y}))
	}

	// private _handleStop: DraggableEventHandler = (e, data) =>
	// 	console.log('_handleStop: ', data)
}

const handleSize = 24
const borderRadius = 4

const Handle = () =>
	<div
		className={handleClassName}
		style={{
			width: handleSize,
			// height: handleSize,
			backgroundColor: CssColor.panelGray,
			position: 'absolute',
			bottom: '100%',
			left: 8,
			borderTopLeftRadius: borderRadius,
			borderTopRightRadius: borderRadius,
			boxShadow: 'inset 0px -6px 8px -5px #000000c2',
		}}
	>
		<IoMdMenu />
	</div>

export function getComponentByNodeType(type: ConnectionNodeType, id: string) {
	switch (type) {
		case ConnectionNodeType.masterClock: return <ConnectedMasterControls />
		case ConnectionNodeType.audioOutput: return <ConnectedVolumeControl />

		case ConnectionNodeType.gridSequencer: return <ConnectedGridSequencerContainer id={id} />
		case ConnectionNodeType.infiniteSequencer: return <ConnectedInfiniteSequencer id={id} />
		case ConnectionNodeType.keyboard: return <ConnectedKeyboard id={id} />

		case ConnectionNodeType.instrument: return <ConnectedBasicInstrumentView id={id} />
		case ConnectionNodeType.sampler: return <ConnectedBasicSampler id={id} />

		default: return null
	}
}

export const ConnectedSimpleGraphNode = shamuConnect(
	(state, {positionId}: ISimpleGraphNodeProps): ISimpleGraphNodeReduxProps => {
		const position = selectPosition(state.room, positionId)!

		return {
			x: position.x,
			y: position.y,
			targetType: position.targetType,
			width: position.width,
			height: position.height,
		}
	},
)(SimpleGraphNode)
