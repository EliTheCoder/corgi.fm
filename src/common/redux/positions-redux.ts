import {Map} from 'immutable'
import {combineReducers, Reducer} from 'redux'
import {createSelector} from 'reselect'
import * as uuid from 'uuid'
import {IClientRoomState} from './common-redux-types'
import {BROADCASTER_ACTION, SERVER_ACTION} from './redux-utils'

export const ADD_POSITION = 'ADD_POSITION'
export type AddPositionAction = ReturnType<typeof addPosition>
export const addPosition = (position: IPosition) => ({
	type: ADD_POSITION as typeof ADD_POSITION,
	position,
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export const DELETE_POSITIONS = 'DELETE_POSITIONS'
export type DeletePositionsAction = ReturnType<typeof deletePositions>
export const deletePositions = (positionIds: string[]) => ({
	type: DELETE_POSITIONS as typeof DELETE_POSITIONS,
	positionIds,
	SERVER_ACTION,
	BROADCASTER_ACTION,
})

export const DELETE_ALL_POSITIONS = 'DELETE_ALL_POSITIONS'
export type DeleteAllPositionsAction = ReturnType<typeof deleteAllPositions>
export const deleteAllPositions = () => ({
	type: DELETE_ALL_POSITIONS as typeof DELETE_ALL_POSITIONS,
})

export const UPDATE_POSITIONS = 'UPDATE_POSITIONS'
export type UpdatePositionsAction = ReturnType<typeof updatePositions>
export const updatePositions = (positions: IPositions) => ({
	type: UPDATE_POSITIONS as typeof UPDATE_POSITIONS,
	positions,
	BROADCASTER_ACTION,
})

export interface IPositionsState {
	all: IPositions
}

export type IPositions = Map<string, IPosition>

export const Positions = Map

export interface IPosition {
	id: string
	targetId: string
	x: number
	y: number
}

export class Position implements IPosition {
	public readonly id = uuid.v4()

	constructor(
		public readonly targetId: string,
		public readonly x: number = 0,
		public readonly y: number = 0,
	) {}
}

export type IPositionAction = AddPositionAction | DeletePositionsAction
	| DeleteAllPositionsAction | UpdatePositionsAction

const positionsSpecificReducer: Reducer<IPositions, IPositionAction> =
	(positions = Positions(), action) => {
		switch (action.type) {
			case ADD_POSITION: return positions.set(action.position.id, action.position)
			case DELETE_POSITIONS: return positions.deleteAll(action.positionIds)
			case DELETE_ALL_POSITIONS: return positions.clear()
			case UPDATE_POSITIONS: return positions.merge(action.positions)
			default: return positions
		}
	}

export const positionsReducer: Reducer<IPositionsState, IPositionAction> = combineReducers({
	all: positionsSpecificReducer,
})

export const selectAllPositions = (state: IClientRoomState) =>
	state.positions.all

export const selectPosition = (state: IClientRoomState, id: string) =>
	selectAllPositions(state).get(id)

export const selectAllPositionsAsArray = createSelector(
	selectAllPositions,
	positions => positions.toIndexedSeq().toArray(),
)

export const selectPositionsWithTargetIds = (state: IClientRoomState, targetIds: string[]) => {
	return selectAllPositionsAsArray(state)
		.filter(x => targetIds.includes(x.targetId))
}