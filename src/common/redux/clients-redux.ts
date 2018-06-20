import Color from 'color'
import {hashbow} from '../../client/utils'
import {ClientId} from '../../client/websocket-listeners'
import {IMidiNote} from '../MidiNote'
import {IAppState} from './configureStore'

export const SET_CLIENTS = 'SET_CLIENTS'
export const NEW_CLIENT = 'NEW_CLIENT'
export const CLIENT_DISCONNECTED = 'CLIENT_DISCONNECTED'
export const CLIENT_DISCONNECTING = 'CLIENT_DISCONNECTING'
export const CLIENT_NOTES = 'CLIENT_NOTES'

export const newClient = (id: ClientId) => {
	return {
		type: NEW_CLIENT,
		id,
	}
}

export const clientDisconnected = (id: ClientId) => {
	return {
		type: CLIENT_DISCONNECTED,
		id,
	}
}

export const clientDisconnecting = (id: ClientId) => {
	return {
		type: CLIENT_DISCONNECTING,
		id,
	}
}

export interface IClient {
	id: string,
	notes: IMidiNote[]
	color: string
	brightColor: string
}

export class Client implements IClient {
	public static fromBackEndClient(backEndClient: any) {
		return new Client(backEndClient.id)
	}

	public id
	public color
	public brightColor
	public notes

	constructor(id: ClientId) {
		this.id = id
		this.color = hashbow(this.id)
		this.brightColor = Color(this.color).saturate(0.8).hsl().string()
	}
}

export class DummyClient implements IClient {
	public id
	public color
	public brightColor
	public notes
}

export type IClientsState = IClient[]

export function clientsReducer(state: IClientsState = [], action) {
	switch (action.type) {
		case SET_CLIENTS:
			return action.clients.map(x => Client.fromBackEndClient(x))
		case NEW_CLIENT:
			return [
				...state.filter(x => x.id !== action.id),
				new Client(action.id),
			]
		case CLIENT_DISCONNECTED:
			return state.filter(x => x.id !== action.id)
		case CLIENT_DISCONNECTING:
			return state.map(x => x.id === action.id ? {...x, disconnecting: true} : x)
		case CLIENT_NOTES:
			return state.map(client => {
				if (client.id === action.clientId) {
					return {
						...client,
						notes: action.notes,
					}
				} else {
					return client
				}
			})
		default:
			return state
	}
}

export function selectOwner(state: IAppState) {
	return state.clients.find(x => x.id === state.websocket.myClientId) || new DummyClient()
}
