import {Map, Record} from 'immutable'
import {combineReducers} from 'redux'
import {ActionType} from 'typesafe-actions'
import {IClientRoomState} from './common-redux-types'
import {BROADCASTER_ACTION, SERVER_ACTION} from '.'

export const pointerActionTypesWhitelist: readonly string[] = [
	'ADD_POINTER',
	'UPDATE_POINTER',
]

export const pointersActions = {
	add: (ownerId: Id) => ({
		type: 'ADD_POINTER',
		ownerId,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	update: (ownerId: Id, pointer: Partial<Pointer>) => ({
		type: 'UPDATE_POINTER',
		ownerId,
		pointer,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	delete: (ownerId: Id) => ({
		type: 'DELETE_POINTER',
		ownerId,
		SERVER_ACTION,
		BROADCASTER_ACTION,
	} as const),
	replaceAll: (pointers: Pointers) => ({
		type: 'REPLACE_ALL_POINTERS',
		pointers,
	} as const),
} as const

export type Pointers = typeof defaultPointers

const defaultPointers = Map<Id, Pointer>()

export type Pointer = typeof defaultPointer

const defaultPointer = Object.freeze({
	ownerId: '-1' as Id,
	x: 0,
	y: 0,
})

const makePointer = Record(defaultPointer)

export type PointersAction = ActionType<typeof pointersActions>

const _pointersReducer = (state = defaultPointers, action: PointersAction): Pointers => {
	switch (action.type) {
		case 'ADD_POINTER': return state.set(action.ownerId, makePointer({ownerId: action.ownerId}))
		case 'UPDATE_POINTER': return state.update(action.ownerId, x => ({...x, ...action.pointer}))
		case 'DELETE_POINTER': return state.delete(action.ownerId)
		case 'REPLACE_ALL_POINTERS': return state.clear().merge(action.pointers)
		default: return state
	}
}

export const pointersStateReducer = combineReducers({
	all: _pointersReducer,
})

export const selectPointersState = (state: IClientRoomState) => state.pointers

export const selectAllPointers = (state: IClientRoomState) => state.pointers.all

export const selectPointer = (state: IClientRoomState, ownerId: Id) =>
	selectAllPointers(state).get(ownerId) || defaultPointer
