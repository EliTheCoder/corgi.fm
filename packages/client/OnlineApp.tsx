import React from 'react'
import {
	selectLocalClientId, selectRoomSettings, shamuConnect,
} from '@corgifm/common/redux'
import {ConnectedChat} from './Chat'
import {ConnectedContextMenuContainer} from './ContextMenu/ContextMenuContainer'
import {ModalManager} from './Modal/ModalManager'
import {ConnectedSimpleGraph} from './SimpleGraph/SimpleGraph'
import {ConnectedTopDiv} from './TopDiv'

interface IOnlineAppProps {}

interface ReduxProps {
	onlyOwnerCanDoStuff: boolean
	isLocalClientRoomOwner: boolean
}

type AllProps = IOnlineAppProps & ReduxProps

export class OnlineApp extends React.PureComponent<AllProps> {
	public render() {
		return (
			<div
				className={this.props.onlyOwnerCanDoStuff && !this.props.isLocalClientRoomOwner ? 'restricted' : ''}
				onDragOver={e => e.preventDefault()}
				onDrop={e => e.preventDefault()}
			>
				<ModalManager />
				<ConnectedChat />
				<ConnectedTopDiv />
				<ConnectedSimpleGraph />
				<ConnectedContextMenuContainer />
			</div>
		)
	}
}

export const ConnectedOnlineApp = shamuConnect(
	(state): ReduxProps => {
		const roomSettings = selectRoomSettings(state.room)

		return {
			isLocalClientRoomOwner: selectLocalClientId(state) === roomSettings.ownerId,
			onlyOwnerCanDoStuff: roomSettings.onlyOwnerCanDoStuff,
		}
	},
)(OnlineApp)
