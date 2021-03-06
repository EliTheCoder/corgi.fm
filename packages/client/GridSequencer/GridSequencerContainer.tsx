import React from 'react'
import {
	selectConnectionSourceColorByTargetId, shamuConnect, selectGridSequencer,
} from '@corgifm/common/redux'
import {GridSequencer} from './GridSequencer'
import './GridSequencer.less'

interface Props {
	id: Id
}

interface ReduxProps {
	isPlaying: boolean
	color: string
	length: number
	rate: number
	isRecording: boolean
}

type AllProps = Props & ReduxProps

export const GridSequencerContainer = (props: AllProps) => {
	const {id, color, isPlaying, length, rate, isRecording} = props

	return (
		<GridSequencer
			color={color}
			isPlaying={isPlaying}
			id={id}
			length={length}
			rate={rate}
			isRecording={isRecording}
		/>
	)
}

export const ConnectedGridSequencerContainer = shamuConnect(
	(state, props: Props): ReduxProps => {
		const gridSequencer = selectGridSequencer(state.room, props.id)

		return {
			isPlaying: gridSequencer.isPlaying,
			color: selectConnectionSourceColorByTargetId(state, props.id),
			length: gridSequencer.midiClip.length,
			rate: gridSequencer.rate,
			isRecording: gridSequencer.isRecording,
		}
	},
)(GridSequencerContainer)
