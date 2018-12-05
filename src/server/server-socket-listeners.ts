import {AnyAction, Store} from 'redux'
import {Server, Socket} from 'socket.io'
import {logger} from '../common/logger'
import {
	deleteBasicInstruments, selectAllInstruments, selectInstrumentsByOwner, updateBasicInstruments,
} from '../common/redux/basic-instruments-redux'
import {
	addClient, clientDisconnected, ClientState, selectAllClients, selectClientBySocketId, setClients,
} from '../common/redux/clients-redux'
import {IAppState} from '../common/redux/configureStore'
import {
	deleteConnections, selectAllConnections, selectConnectionsWithSourceOrTargetIds, updateConnections,
} from '../common/redux/connections-redux'
import {BROADCASTER_ACTION} from '../common/redux/redux-utils'
import {selectAllTracks, updateTracks} from '../common/redux/tracks-redux'
import {
	deleteVirtualKeyboards, selectAllVirtualKeyboards, selectVirtualKeyboardsByOwner, updateVirtualKeyboards,
} from '../common/redux/virtual-keyboard-redux'
import {BroadcastAction} from '../common/redux/websocket-client-sender-middleware'
import {WebSocketEvent} from '../common/server-constants'

export function setupServerWebSocketListeners(io: Server, store: Store) {
	io.on('connection', socket => {
		logger.log('new connection | ', socket.id)

		const addClientAction = addClient(new ClientState(socket.id))
		store.dispatch(addClientAction)
		io.local.emit(WebSocketEvent.broadcast, addClientAction)

		syncState(socket, store)

		socket.on(WebSocketEvent.broadcast, (action: BroadcastAction) => {
			logger.debug(`${WebSocketEvent.broadcast}: ${socket.id} | `, action)
			if (action[BROADCASTER_ACTION]) {
				store.dispatch(action)
			}
			socket.broadcast.emit(WebSocketEvent.broadcast, {...action, alreadyBroadcasted: true})
		})

		socket.on(WebSocketEvent.serverAction, (action: AnyAction) => {
			logger.debug(`${WebSocketEvent.serverAction}: ${socket.id} | `, action)
			store.dispatch(action)
		})

		socket.on('disconnect', () => {
			logger.log(`client disconnected: ${socket.id}`)
			const state: IAppState = store.getState()
			const clientId = selectClientBySocketId(state, socket.id).id

			const clientDisconnectedAction = clientDisconnected(clientId)
			store.dispatch(clientDisconnectedAction)
			io.local.emit(WebSocketEvent.broadcast, clientDisconnectedAction)

			const instrumentIdsToDelete = selectInstrumentsByOwner(state, clientId).map(x => x.id)
			const keyboardIdsToDelete = selectVirtualKeyboardsByOwner(state, clientId).map(x => x.id)

			const sourceAndTargetIds = instrumentIdsToDelete.concat(keyboardIdsToDelete)
			const connectionIdsToDelete = selectConnectionsWithSourceOrTargetIds(state, sourceAndTargetIds).map(x => x.id)
			const deleteConnectionsAction = deleteConnections(connectionIdsToDelete)
			store.dispatch(deleteConnectionsAction)
			io.local.emit(WebSocketEvent.broadcast, deleteConnectionsAction)

			const deleteBasicInstrumentsAction = deleteBasicInstruments(instrumentIdsToDelete)
			store.dispatch(deleteBasicInstrumentsAction)
			io.local.emit(WebSocketEvent.broadcast, deleteBasicInstrumentsAction)

			const deleteVirtualKeyboardsAction = deleteVirtualKeyboards(keyboardIdsToDelete)
			store.dispatch(deleteVirtualKeyboardsAction)
			io.local.emit(WebSocketEvent.broadcast, deleteVirtualKeyboardsAction)

			logger.log(`done cleaning: ${socket.id}`)
		})
	})
}

const server = 'server'

function syncState(newClientSocket: Socket, store: Store) {
	const state: IAppState = store.getState()

	newClientSocket.emit(WebSocketEvent.broadcast, {
		...setClients(selectAllClients(state)),
		alreadyBroadcasted: true,
		source: server,
	})

	newClientSocket.emit(WebSocketEvent.broadcast, {
		...updateBasicInstruments(selectAllInstruments(state)),
		alreadyBroadcasted: true,
		source: server,
	})

	newClientSocket.emit(WebSocketEvent.broadcast, {
		...updateVirtualKeyboards(selectAllVirtualKeyboards(state)),
		alreadyBroadcasted: true,
		source: server,
	})

	newClientSocket.emit(WebSocketEvent.broadcast, {
		...updateTracks(selectAllTracks(state)),
		alreadyBroadcasted: true,
		source: server,
	})

	newClientSocket.emit(WebSocketEvent.broadcast, {
		...updateConnections(selectAllConnections(state)),
		alreadyBroadcasted: true,
		source: server,
	})
}
