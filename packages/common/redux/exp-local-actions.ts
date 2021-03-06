import {ActionType} from 'typesafe-actions'
import {Set} from 'immutable'
import {GroupType} from '../exp-node-infos'

export const expLocalActions = {
	createGroup: (nodeIds: Set<Id>, groupType: GroupType) => ({
		type: 'EXP_CREATE_GROUP',
		nodeIds,
		groupType,
	} as const),
	createPreset: (nodeId: Id) => ({
		type: 'EXP_CREATE_PRESET',
		nodeId,
	} as const),
	createNodeFromPreset: (presetId: Id, position: Point) => ({
		type: 'EXP_CREATE_NODE_FROM_PRESET',
		presetId,
		position,
	} as const),
	convertGroupToPolyGroup: (groupNodeId: Id) => ({
		type: 'EXP_CONVERT_GROUP_TO_POLY_GROUP',
		groupNodeId,
	} as const),
} as const

export type ExpLocalAction = ActionType<typeof expLocalActions>
