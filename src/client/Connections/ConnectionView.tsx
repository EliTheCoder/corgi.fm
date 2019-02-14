import {List} from 'immutable'
import * as React from 'react'
import Draggable, {DraggableEventHandler} from 'react-draggable'
import {Dispatch} from 'redux'
import {
	connectionsActions, defaultGhostConnector, GhostConnectorRecord, GhostConnectorStatus,
	GhostConnectorType, IClientAppState, selectUserInputKeys, shamuConnect,
} from '../../common/redux'
import {saturateColor} from '../../common/shamu-color'
import {simpleGlobalClientState} from '../SimpleGlobalClientState'
import './ConnectionView.less'
import {Connector} from './Connector'

export interface IConnectionViewProps {
	color: string
	sourceX: number
	sourceY: number
	targetX: number
	targetY: number
	ghostConnector?: GhostConnectorRecord
	saturateSource: boolean
	saturateTarget: boolean
	id: string
	sourceStackOrder?: number
	targetStackOrder?: number
}

interface IConnectionViewReduxProps {
	isAddMode: boolean
}

type IConnectionViewAllProps = IConnectionViewProps & IConnectionViewReduxProps & {dispatch: Dispatch}

class LineState {
	constructor(
		public readonly x1: number,
		public readonly y1: number,
		public readonly x2: number,
		public readonly y2: number,
	) {}

	public readonly width = () => Math.abs(this.x1 - this.x2)
	public readonly height = () => Math.abs(this.y1 - this.y2)
	public readonly leftMost = () => Math.min(this.x1, this.x2)
	public readonly topMost = () => Math.min(this.y1, this.y2)
}

const longLineStrokeWidth = 2
const connectorWidth = 16
const connectorHeight = 8

const line0 = new LineState(0, 0, 0, 0)

export class ConnectionView extends React.PureComponent<IConnectionViewAllProps> {
	public render() {
		const {color, saturateSource, saturateTarget, id,
			ghostConnector = defaultGhostConnector, targetStackOrder = 0, sourceStackOrder = 0} = this.props

		const sourceConnectorLeft = this.props.sourceX + (connectorWidth * sourceStackOrder)
		const sourceConnectorRight = this.props.sourceX + connectorWidth + (connectorWidth * sourceStackOrder)
		const targetConnectorLeft = this.props.targetX - connectorWidth - (connectorWidth * targetStackOrder)
		const targetConnectorRight = this.props.targetX - (connectorWidth * targetStackOrder)

		const connectedLine = new LineState(
			sourceConnectorRight,
			this.props.sourceY,
			targetConnectorLeft,
			this.props.targetY,
		)

		const ghostLine = (() => {
			switch (ghostConnector.status) {
				case GhostConnectorStatus.activeSource:
					return new LineState(
						ghostConnector.x + connectorWidth,
						ghostConnector.y,
						targetConnectorLeft,
						this.props.targetY,
					)
				case GhostConnectorStatus.activeTarget:
					return new LineState(
						sourceConnectorRight,
						this.props.sourceY,
						ghostConnector.x,
						ghostConnector.y,
					)
				default:
					return line0
			}
		})()

		const buffer = 50
		const joint = 8

		const pathDPart1 = makeCurvedPath(connectedLine)

		const pathDPart1Ghost = makeCurvedPath(ghostLine)

		function makeCurvedPath(line: LineState) {
			const diff2 = Math.abs((line.x2 - line.x1) / 2)

			const curveStrength2 = Math.max(10, diff2)

			return `
				M ${line.x1} ${line.y1}
				C ${line.x1 + joint + curveStrength2} ${line.y1} ${line.x2 - joint - curveStrength2} ${line.y2} ${line.x2} ${line.y2}
			`
		}

		function makeStraightPath(line: LineState) {
			return `
				M ${line.x1} ${line.y1}
				L ${line.x1 + joint} ${line.y1}
				L ${line.x2 - joint} ${line.y2}
				L ${line.x2} ${line.y2}
			`
		}

		// This path is a hack to get the filter to work properly
		// It forces the "render box?" to be bigger than the actual drawn path
		const pathDPart2 = `M ${connectedLine.x1 + buffer} ${connectedLine.y1 + buffer} M ${connectedLine.x2 + buffer} ${connectedLine.y2 + buffer}`
			+ `M ${connectedLine.x1 - buffer} ${connectedLine.y1 - buffer} M ${connectedLine.x2 - buffer} ${connectedLine.y2 - buffer}`

		const pathDFull = pathDPart1 + ' ' + pathDPart2

		const isGhostHidden = ghostConnector.status === GhostConnectorStatus.hidden

		return (
			<div className="connection">
				<svg
					className={`colorize longLine`}
					xmlns="http://www.w3.org/2000/svg"
					style={{
						position: 'fixed',
						pointerEvents: 'none',
						color,
						fill: 'none',
					}}
				>
					<defs>
						<linearGradient
							id={id}
							x1={(connectedLine.x1)}
							y1={(connectedLine.y1)}
							x2={(connectedLine.x2)}
							y2={(connectedLine.y2)}
							gradientUnits="userSpaceOnUse"
						// gradientUnits="objectBoundingBox"
						>
							<stop stopColor={saturateSource ? saturateColor(color) : color} offset="0%" />
							<stop stopColor={saturateTarget ? saturateColor(color) : color} offset="100%" />
						</linearGradient>
						<filter id="saturate">
							<feColorMatrix in="SourceGraphic"
								type="saturate"
								values="3" />
						</filter>
					</defs>
					<g
						onContextMenu={(e: React.MouseEvent) => {
							this.props.dispatch(connectionsActions.delete(List([id])))
							e.preventDefault()
						}}
					>
						<path
							d={pathDPart1}
							stroke={`url(#${id})`}
							strokeWidth={longLineStrokeWidth + 'px'}
						/>
						<path
							className="invisibleLongLine"
							d={pathDPart1}
							stroke="#0000"
							strokeWidth={24 + 'px'}
						/>
						<path
							className="blurLine"
							d={pathDFull}
							stroke={`url(#${id})`}
							strokeWidth={4 + 'px'}
						/>
					</g>

				</svg>
				<Connector
					width={connectorWidth}
					height={connectorHeight}
					x={sourceConnectorLeft}
					y={this.props.sourceY}
					color={color}
				/>
				<Connector
					width={connectorWidth}
					height={connectorHeight}
					x={targetConnectorLeft}
					y={this.props.targetY}
					color={color}
				/>
				<div className={`ghost ${ghostConnector.status === GhostConnectorStatus.hidden ? 'hidden' : 'active'}`}>
					{!isGhostHidden &&
						<svg
							className={`colorize longLine`}
							xmlns="http://www.w3.org/2000/svg"
							style={{
								position: 'fixed',
								pointerEvents: 'none',
								color,
								fill: 'none',
							}}
						>
							<g>
								<path
									d={pathDPart1Ghost}
									strokeWidth={longLineStrokeWidth + 'px'}
									strokeDasharray={4}
									stroke={`url(#${id})`}
								/>
							</g>
						</svg>
					}
					{this.props.isAddMode === false &&
						<React.Fragment>
							<GhostConnector
								dispatch={this.props.dispatch}
								isActive={ghostConnector.status === GhostConnectorStatus.activeSource}
								ghostConnector={ghostConnector}
								parentX={sourceConnectorLeft}
								parentY={this.props.sourceY}
								connectionId={id}
								sourceOrTarget={GhostConnectorStatus.activeSource}
								movingOrAdding={GhostConnectorType.moving}
								color={color}
							/>
							<GhostConnector
								dispatch={this.props.dispatch}
								isActive={ghostConnector.status === GhostConnectorStatus.activeTarget}
								ghostConnector={ghostConnector}
								parentX={targetConnectorLeft}
								parentY={this.props.targetY}
								connectionId={id}
								sourceOrTarget={GhostConnectorStatus.activeTarget}
								movingOrAdding={GhostConnectorType.moving}
								color={color}
							/>
						</React.Fragment>
					}
					{this.props.isAddMode === true &&
						<React.Fragment>
							<GhostConnector
								dispatch={this.props.dispatch}
								isActive={ghostConnector.status === GhostConnectorStatus.activeTarget}
								ghostConnector={ghostConnector}
								parentX={sourceConnectorLeft}
								parentY={this.props.sourceY}
								connectionId={id}
								sourceOrTarget={GhostConnectorStatus.activeTarget}
								movingOrAdding={GhostConnectorType.adding}
								color={color}
							/>
							<GhostConnector
								dispatch={this.props.dispatch}
								isActive={ghostConnector.status === GhostConnectorStatus.activeSource}
								ghostConnector={ghostConnector}
								parentX={targetConnectorLeft}
								parentY={this.props.targetY}
								connectionId={id}
								sourceOrTarget={GhostConnectorStatus.activeSource}
								movingOrAdding={GhostConnectorType.adding}
								color={color}
							/>
						</React.Fragment>
					}
				</div>
			</div>
		)
	}
}

interface IGhostConnectorProps {
	dispatch: Dispatch
	isActive: boolean
	ghostConnector: GhostConnectorRecord
	parentX: number
	parentY: number
	connectionId: string
	sourceOrTarget: GhostConnectorStatus
	movingOrAdding: GhostConnectorType
	color: string
}

class GhostConnector extends React.PureComponent<IGhostConnectorProps> {
	public render() {
		const {isActive, ghostConnector, parentX, parentY, color} = this.props

		return (
			<Draggable
				scale={simpleGlobalClientState.zoom}
				onStart={this._handleStartDrag}
				onStop={this._handleStopDrag}
				onDrag={this._handleDrag}
				position={isActive
					? {
						x: ghostConnector.x,
						y: ghostConnector.y,
					}
					: {
						x: parentX,
						y: parentY,
					}
				}
			>
				<div>
					<Connector
						width={connectorWidth}
						height={connectorHeight}
						color={color}
					/>
				</div>
			</Draggable>
		)
	}

	private readonly _handleDrag: DraggableEventHandler = (_, data) => {
		this.props.dispatch(connectionsActions.moveGhostConnector(
			this.props.connectionId,
			data.x,
			data.y,
		))
	}

	private readonly _handleStartDrag: DraggableEventHandler = (_, __) => {
		this.props.dispatch(connectionsActions.updateGhostConnector(
			this.props.connectionId, {
				addingOrMoving: this.props.movingOrAdding,
				status: this.props.sourceOrTarget,
				x: this.props.parentX,
				y: this.props.parentY,
			}))
	}

	private readonly _handleStopDrag: DraggableEventHandler = (_, __) => {
		this.props.dispatch(connectionsActions.stopDraggingGhostConnector(
			this.props.connectionId))
	}
}

export const ConnectedConnectionView = shamuConnect(
	(state: IClientAppState): IConnectionViewReduxProps => ({
		isAddMode: selectUserInputKeys(state).ctrl,
	}),
)(ConnectionView)
