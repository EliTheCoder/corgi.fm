import {stripIndent} from 'common-tags'
import {List} from 'immutable'
import React from 'react'
import {useDispatch} from 'react-redux'
import {
	ActiveGhostConnectorSourceOrTarget,
	AppOptions,
	calculateExpConnectorPositionY, expConnectionsActions,
	GhostConnection,
	ghostConnectorActions, GhostConnectorAddingOrMoving,
	IClientAppState, IExpConnection,
	LineType,
	selectLocalClientId, selectOption, selectExpPosition,
	selectRoomSettings, shamuConnect, selectExpConnection,
	selectExpConnectionSourceIsSending,
	selectExpConnectionSourceIsActive,
	selectExpConnectionSourceColor,
	selectExpConnectionStackOrderForSource,
	selectExpConnectionStackOrderForTarget,
} from '@corgifm/common/redux'
import {longLineTooltip} from '../client-constants'
import {ConnectionLine} from './ConnectionLine'
import './ConnectionView.less'
import {Connector} from './Connector'
import {LineState} from './LineState'

export interface IExpConnectionViewProps {
	id: Id
}

interface IExpConnectionViewReduxProps {
	speed?: number
	highQuality: boolean
	color: string
	isSourcePlaying: boolean
	localClientId: ClientId
	sourceX: number
	sourceY: number
	targetX: number
	targetY: number
	saturateSource: boolean
	saturateTarget: boolean
	sourceStackOrder?: number
	targetStackOrder?: number
	connection: IExpConnection
	lineType: LineType
}

type IExpConnectionViewAllProps = IExpConnectionViewProps & IExpConnectionViewReduxProps

export const longLineStrokeWidth = 2
export const connectorWidth = 16
export const connectorHeight = 8

const buffer = 50
const joint = 8

export const ExpConnectionView =
	React.memo(function _ExpConnectionView(props: IExpConnectionViewAllProps) {
		const {
			color, saturateSource, saturateTarget, id, sourceX, sourceY, targetX, targetY,
			targetStackOrder = 0, sourceStackOrder = 0, speed = 1, lineType,
			isSourcePlaying, highQuality, localClientId, connection,
		} = props

		const dispatch = useDispatch()

		const sourceConnectorLeft = sourceX + (connectorWidth * sourceStackOrder)
		const sourceConnectorRight = sourceX + connectorWidth + (connectorWidth * sourceStackOrder)
		const targetConnectorLeft = targetX - connectorWidth - (connectorWidth * targetStackOrder)
		// const targetConnectorRight = targetX - (connectorWidth * targetStackOrder)

		const connectedLine = new LineState(
			sourceConnectorRight,
			sourceY,
			targetConnectorLeft,
			targetY,
		)

		const pathDPart1 = lineType === LineType.Straight
			? makeStraightPath(connectedLine)
			: makeCurvedPath(connectedLine)

		// This path is a hack to get the filter to work properly
		// It forces the "render box?" to be bigger than the actual drawn path
		const pathDPart2 = `M ${connectedLine.x1 + buffer} ${connectedLine.y1 + buffer} M ${connectedLine.x2 + buffer} ${connectedLine.y2 + buffer}`
			+ `M ${connectedLine.x1 - buffer} ${connectedLine.y1 - buffer} M ${connectedLine.x2 - buffer} ${connectedLine.y2 - buffer}`

		const pathDFull = pathDPart1 + ' ' + pathDPart2

		function onMouseDown(
			connectorPositionX: number,
			connectorPositionY: number,
			sourceOrTarget: ActiveGhostConnectorSourceOrTarget,
			parentNodeId: Id,
		) {
			dispatch(ghostConnectorActions.create(new GhostConnection(
				{x: connectorPositionX, y: connectorPositionY},
				{parentNodeId},
				sourceOrTarget,
				localClientId,
				GhostConnectorAddingOrMoving.Moving,
				sourceOrTarget === ActiveGhostConnectorSourceOrTarget.Source
					? connection.sourcePort
					: connection.targetPort,
				connection.id,
			)))
		}

		return (
			<div className={`connection ${saturateSource ? 'playing' : ''}`} style={{color}}>
				<ConnectionLine
					id={id}
					color={color}
					saturateSource={saturateSource}
					saturateTarget={saturateTarget}
					pathDPart1={pathDPart1}
					pathDFull={pathDFull}
					connectedLine={connectedLine}
					speed={speed}
					isSourcePlaying={isSourcePlaying}
					highQuality={highQuality}
				/>
				<Connector
					width={connectorWidth}
					height={connectorHeight}
					x={sourceConnectorLeft}
					y={sourceY}
					saturate={highQuality ? (saturateSource || isSourcePlaying) : isSourcePlaying}
					title={longLineTooltip}
					svgProps={{
						onMouseDown: e => e.button === 0 && onMouseDown(
							sourceConnectorLeft,
							sourceY,
							ActiveGhostConnectorSourceOrTarget.Source,
							connection.targetId,
						),
						onContextMenu: (e: React.MouseEvent) => {
							if (e.shiftKey) return
							dispatch(expConnectionsActions.delete(List([id])))
							e.preventDefault()
						},
					}}
				/>
				<Connector
					width={connectorWidth}
					height={connectorHeight}
					x={targetConnectorLeft}
					y={targetY}
					saturate={highQuality ? (saturateTarget || isSourcePlaying) : isSourcePlaying}
					title={longLineTooltip}
					svgProps={{
						onMouseDown: e => e.button === 0 && onMouseDown(
							targetConnectorLeft,
							targetY,
							ActiveGhostConnectorSourceOrTarget.Target,
							connection.sourceId,
						),
						onContextMenu: (e: React.MouseEvent) => {
							if (e.shiftKey) return
							dispatch(expConnectionsActions.delete(List([id])))
							e.preventDefault()
						},
					}}
				/>
			</div>
		)
	})

export function makeCurvedPath(line: LineState) {
	const distance = Math.sqrt(((line.x1 - line.x2) ** 2) + ((line.y1 - line.y2) ** 2))
	// const diff2 = Math.abs((line.x2 - line.x1) / 10)

	const curveStrength2 = distance / 4
	// const curveStrength2 = 64

	return stripIndent`
		M ${line.x1} ${line.y1}
		C ${line.x1 + joint + curveStrength2} ${line.y1} ${line.x2 - joint - curveStrength2} ${line.y2} ${line.x2} ${line.y2}
	`
}

export function makeStraightPath(line: LineState) {
	return stripIndent`
		M ${line.x1} ${line.y1}
		L ${line.x1 + joint} ${line.y1}
		L ${line.x2 - joint} ${line.y2}
		L ${line.x2} ${line.y2}
	`
}

export const ConnectedExpConnectionView = shamuConnect(
	function connectionViewMapStateToProps(state: IClientAppState, props: IExpConnectionViewProps): IExpConnectionViewReduxProps {
		// const globalClockState = selectGlobalClockState(state.room)
		const connection = selectExpConnection(state.room, props.id)
		const isSourceSending = selectExpConnectionSourceIsSending(state.room, connection.id)
		const isSourceActive = isSourceSending || selectExpConnectionSourceIsActive(state.room, connection.id)
		const sourcePosition = selectExpPosition(state.room, connection.sourceId)
		const targetPosition = selectExpPosition(state.room, connection.targetId)
		const sourceColor = selectExpConnectionSourceColor(state, props.id)

		return {
			speed: 120,
			// Disabled for now because of performance issues
			// speed: globalClockState.bpm,
			highQuality: selectOption(state, AppOptions.graphicsFancyConnections) as boolean,
			isSourcePlaying: false,
			localClientId: selectLocalClientId(state),
			sourceStackOrder: selectExpConnectionStackOrderForSource(state.room, props.id),
			targetStackOrder: selectExpConnectionStackOrderForTarget(state.room, props.id),
			color: sourceColor,
			sourceX: sourcePosition.x + sourcePosition.width,
			sourceY: calculateExpConnectorPositionY(sourcePosition.y, sourcePosition.height, 1, connection.sourcePort),
			targetX: targetPosition.x,
			targetY: calculateExpConnectorPositionY(targetPosition.y, targetPosition.height, 1, connection.targetPort),
			saturateSource: isSourceActive || isSourceSending,
			saturateTarget: isSourceSending,
			connection,
			lineType: selectRoomSettings(state.room).lineType,
		}
	},
)(ExpConnectionView)
