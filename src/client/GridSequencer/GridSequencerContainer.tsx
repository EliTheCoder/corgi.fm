import * as React from 'react'
import {connect} from 'react-redux'
import {IClientAppState} from '../../common/redux/common-redux-types'
import {selectAllGridSequencers} from '../../common/redux/grid-sequencers-redux'
import {GridSequencer} from './GridSequencer'
import './GridSequencer.less'

interface IGridSequencerContainerProps {
	isPlaying: boolean
	color: string
	id: string
	name: string
}

export const GridSequencerContainer = (props: IGridSequencerContainerProps) => {
	const {id, color, isPlaying, name} = props

	return (
		<GridSequencer
			color={color}
			isPlaying={isPlaying}
			id={id}
			name={name}
		/>
	)
}

interface IConnectedGridSequencerContainerProps {
	id: string
}

const mapStateToProps = (state: IClientAppState, props: IConnectedGridSequencerContainerProps) => {
	const gridSequencer = selectAllGridSequencers(state.room)[props.id]

	return {
		isPlaying: gridSequencer.isPlaying,
		color: gridSequencer.color,
		name: gridSequencer.name,
	}
}

export const ConnectedGridSequencerContainer = connect(
	mapStateToProps,
)(GridSequencerContainer)