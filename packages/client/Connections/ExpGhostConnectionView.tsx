import React, {useState, useLayoutEffect, useCallback} from 'react'
import {useSelector, useDispatch} from 'react-redux'
import {
	ActiveGhostConnectorSourceOrTarget, expGhostConnectorActions,
	selectExpGhostConnection, selectLocalClientId,
	IClientAppState, createExpPositionSelector, ActiveConnector,
} from '@corgifm/common/redux'
import {toGraphSpace} from '../SimpleGraph/Zoom'
import {usePort} from '../Experimental/hooks/usePort'
import {useObjectChangedEvent, useNumberChangedEvent} from '../Experimental/hooks/useCorgiEvent'
import {ExpPortReact} from '../Experimental/ExpPorts'
import {connectorHeight, connectorWidth, makeCurvedPath} from './ConnectionView'
import {Connector} from './Connector'
import {GhostConnectionLine} from './GhostConnectionLine'
import {LineState} from './LineState'

interface Props {
	id: Id
}

export const ConnectedExpGhostConnectionView = React.memo(
	function _ConnectedExpGhostConnectionView({
		id,
	}: Props) {

		const {activeConnector, inactiveConnector, activeSourceOrTarget, inactivePort, ownerId} = useSelector(
			(state: IClientAppState) => selectExpGhostConnection(state.room, id))

		const parentId = inactiveConnector.parentNodeId

		const expPort = usePort(parentId, inactivePort)

		if (!expPort) {
			return null
		} else {
			return (
				<ExpGhostConnectionView
					id={id}
					activeConnector={activeConnector}
					parentId={parentId}
					ownerId={ownerId}
					activeSourceOrTarget={activeSourceOrTarget}
					expPort={expPort}
				/>
			)
		}
	}
)

interface ExpGhostConnectionViewProps {
	readonly id: Id
	readonly activeConnector: ActiveConnector
	readonly parentId: Id
	readonly ownerId: Id
	readonly activeSourceOrTarget: ActiveGhostConnectorSourceOrTarget
	readonly expPort: ExpPortReact
}

const ExpGhostConnectionView = ({
	id, activeConnector, parentId, ownerId,
	activeSourceOrTarget, expPort,
}: ExpGhostConnectionViewProps) => {
	const portPosition = useObjectChangedEvent(expPort.onPositionChanged)
	const portConnectionsCount = useNumberChangedEvent(expPort.onConnectionCountChanged)

	const [mousePosition, setMousePosition] = useState(activeConnector)

	const parentPosition = useSelector(createExpPositionSelector(parentId))

	const localClientId = useSelector((state: IClientAppState) => selectLocalClientId(state))

	const isLocallyOwned = ownerId === localClientId

	const position = isLocallyOwned
		? mousePosition
		: activeConnector

	const activeConnectorPosition: Point =
		activeSourceOrTarget === ActiveGhostConnectorSourceOrTarget.Source
			? {
				x: position.x + (connectorWidth / 2),
				y: position.y,
			}
			: {
				x: position.x - (connectorWidth / 2),
				y: position.y,
			}

	const anchorConnectorPosition: Point =
		activeSourceOrTarget === ActiveGhostConnectorSourceOrTarget.Source
			? {
				x: parentPosition.x + portPosition.x - (portConnectionsCount * connectorWidth) - connectorWidth,
				y: parentPosition.y + portPosition.y,
			}
			: {
				x: parentPosition.x + parentPosition.width - portPosition.x + (portConnectionsCount * connectorWidth) + connectorWidth,
				y: parentPosition.y + portPosition.y,
			}

	const connectedLine =
		activeSourceOrTarget === ActiveGhostConnectorSourceOrTarget.Source
			? new LineState(
				activeConnectorPosition.x,
				activeConnectorPosition.y,
				anchorConnectorPosition.x,
				anchorConnectorPosition.y,
			)
			: new LineState(
				anchorConnectorPosition.x,
				anchorConnectorPosition.y,
				activeConnectorPosition.x,
				activeConnectorPosition.y,
			)

	const pathDPart1 = makeCurvedPath(connectedLine)

	const dispatch = useDispatch()

	const updateMousePosition = useCallback((ev: MouseEvent) => {
		setMousePosition(toGraphSpace(
			ev.clientX,
			ev.clientY,
		))

		dispatch(expGhostConnectorActions.move(
			id,
			mousePosition.x,
			mousePosition.y,
		))
	}, [dispatch, id, mousePosition.x, mousePosition.y])

	const handleMouseUp = useCallback((ev: MouseEvent) => {
		dispatch(expGhostConnectorActions.delete(id))
	}, [dispatch, id])

	useLayoutEffect(() => {
		if (isLocallyOwned !== true) return
		window.addEventListener('mousemove', updateMousePosition)
		window.addEventListener('mouseup', handleMouseUp)

		return () => {
			window.removeEventListener('mousemove', updateMousePosition)
			window.removeEventListener('mouseup', handleMouseUp)
		}
	})

	return (
		<div style={{color: 'orange'}}>
			<Connector
				width={connectorWidth}
				height={connectorHeight}
				saturate={false}
				x={position.x - (connectorWidth / 2)}
				y={position.y}
				svgProps={{
					style: {
						pointerEvents: 'none',
					},
				}}
			/>
			<Connector
				width={connectorWidth}
				height={connectorHeight}
				saturate={false}
				x={
					activeSourceOrTarget === ActiveGhostConnectorSourceOrTarget.Source
						? anchorConnectorPosition.x
						: anchorConnectorPosition.x - connectorWidth
				}
				y={anchorConnectorPosition.y}
			/>
			<GhostConnectionLine
				color="orange"
				pathDPart1={pathDPart1}
			/>
		</div>
	)
}
