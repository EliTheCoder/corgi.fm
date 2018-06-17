import {Store} from 'redux'
import * as io from 'socket.io-client'
import {logger} from './logger'
import {IMidiNote} from './MIDI/MidiNote'
import {Octave} from './music/music-types'
import {clientDisconnected, newClient, SET_CLIENTS} from './redux/clients-redux'
import {SET_TRACK_SIMPLE_TRACK_NOTE} from './redux/simple-track-redux'
import {PLAY_SIMPLE_TRACK, playSimpleTrack, STOP_SIMPLE_TRACK, stopSimpleTrack} from './redux/track-player-middleware'
import {setVirtualKeys, virtualOctave} from './redux/virtual-keyboard-redux'
import {SET_MY_CLIENT_ID, setInfo, setSocket} from './redux/websocket-redux'

const port = 80

export function setupWebsocketAndListeners(store: Store) {
	const socket = io.connect(window.location.hostname + `:${port}/`)

	logger.log('socket connected')

	store.dispatch(setSocket(socket))

	socket.on('connect', () => {
		socketInfo('connected')
		setClientId(socket.id)
	})

	function setClientId(newClientId) {
		store.dispatch({
			type: SET_MY_CLIENT_ID,
			id: newClientId,
		})
	}

	setupDefaultListeners([
		['disconnect'],
		['reconnect_attempt'],
		['reconnecting'],
		['reconnect_error'],
		['reconnect_failed'],
		['ping'],
		['reconnect'],
		['connect_timeout'],
		['error'],
		['connect_error'],
		['pong', 'pong - latency'],
		['newClient'],
		['clientDisconnected'],
	])

	function setupDefaultListeners(events: Array<[string, string] | [string]>) {
		events.forEach(event => setupDefaultEventListener(event[0], event[1]))
	}

	function setupDefaultEventListener(eventName: string, friendlyName?: string) {
		socket.on(eventName, data => {
			socketInfo(`${friendlyName || eventName}: ` + JSON.stringify(data, null, 2))
		})
	}

	socket.on('clients', data => {
		logger.log('clients: ', data.clients)
		setClients(data.clients)
	})

	function setClients(newClients) {
		store.dispatch({
			type: SET_CLIENTS,
			clients: newClients,
		})
	}

	socket.on('newClient', data => {
		logger.log('newClient: ', data)
		store.dispatch(newClient(data.id))
	})

	socket.on('clientDisconnected', data => {
		logger.log('clientDisconnected: ', data)
		store.dispatch(clientDisconnected(data.id))
	})

	socket.on('notes', (data: NotesPayload) => {
		logger.debug('notes: ', data)
		store.dispatch(setVirtualKeys(data.clientId, data.notes))
	})

	socket.on('octave', (data: OctavePayload) => {
		logger.log('octave: ', data)
		store.dispatch(virtualOctave(data.clientId, data.octave))
	})

	socket.on(SET_TRACK_SIMPLE_TRACK_NOTE, action => {
		logger.log('SET_TRACK_SIMPLE_TRACK_NOTE: ', action)
		store.dispatch({...action, isRemote: true})
	})

	socket.on(PLAY_SIMPLE_TRACK, () => {
		logger.log('PLAY_SIMPLE_TRACK: ')
		store.dispatch({...playSimpleTrack(), isRemote: true})
	})

	socket.on(STOP_SIMPLE_TRACK, () => {
		logger.log('STOP_SIMPLE_TRACK: ')
		store.dispatch({...stopSimpleTrack(), isRemote: true})
	})

	function socketInfo(info: string) {
		store.dispatch(setInfo(info))
		logger.log(info)
	}

	return socket
}

export type ClientId = string

export interface NotesPayload {
	notes: IMidiNote[]
	clientId: ClientId
}

export interface OctavePayload {
	octave: Octave
	clientId: ClientId
}