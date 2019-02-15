import * as React from 'react'
import {selectAllConnectionIds, shamuConnect} from '../../common/redux'
import {ConnectedConnectionViewContainer} from './ConnectionViewContainer'

export enum ConnectionsUsage {
	normal = 'normal',
	simpleGraph = 'simpleGraph',
}

interface IConnectionsProps {}

interface IConnectionsReduxProps {
	connectionIds: string[]
}

type IConnectionsAllProps = IConnectionsProps & IConnectionsReduxProps

export const Connections = React.memo(({connectionIds}: IConnectionsAllProps) => {
	return (
		<div className="connections">
			{connectionIds.map(connectionId =>
				<ConnectedConnectionViewContainer key={connectionId} id={connectionId} />,
			)}
		</div>
	)
})

export const ConnectedConnections = shamuConnect(
	(state): IConnectionsReduxProps => ({
		connectionIds: selectAllConnectionIds(state.room),
	}),
)(Connections)
