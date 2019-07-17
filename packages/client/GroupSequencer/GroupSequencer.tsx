import React from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {
	groupSequencerActions, IClientAppState, selectGroupSequencer,
} from '@corgifm/common/redux'
import {Panel} from '../Panel/Panel'
import './GroupSequencer.less'

interface Props {
	id: string
	color: string
}

export function GroupSequencerView({id, color}: Props) {
	const dispatch = useDispatch()
	const groupSequencer = useSelector((state: IClientAppState) =>
		selectGroupSequencer(state.room, id))

	return (
		<Panel
			id={id}
			label={groupSequencer.name}
			className="groupSequencer"
			color={color}
		>
			{groupSequencer.groups.map((group, port) => {
				return (
					<div
						key={port}
						className="groupRow"
						style={{color: group.color}}
					>
						{group.events.map((event, i) => {
							return (
								<div
									key={i}
									className={
										`groupEvent ${event.on ? 'on' : 'off'}`
									}
									onClick={() => {
										dispatch(groupSequencerActions
											.setEnabled(id, port, i, !event.on))
									}}
								/>
							)
						})}
					</div>
				)
			}).toList()}
		</Panel>
	)
}