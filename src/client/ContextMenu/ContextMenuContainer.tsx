import React, {MouseEvent} from 'react'
import {backgroundMenuId} from '../client-constants';
import {MenuItem, ContextMenu} from 'react-contextmenu';
import './ContextMenu.less'
import {
	shamuConnect, addBasicSynthesizer, BasicSynthesizerState, addPosition,
	makePosition, GridSequencerState, addGridSequencer,
	createSequencerEvents, BasicSamplerState, addBasicSampler,
	InfiniteSequencerState, InfiniteSequencerStyle, addInfiniteSequencer,
	SimpleReverbState, addSimpleReverb
} from '../../common/redux';
import {Dispatch} from 'redux';
import {serverClientId} from '../../common/common-constants';
import {ConnectionNodeType, Point, IConnectable} from '../../common/common-types';
import {simpleGlobalClientState} from '../SimpleGlobalClientState';
import {MidiNotes} from '../../common/MidiNote';
import {makeMidiClipEvent} from '../../common/midi-types';

interface AllProps {
	dispatch: Dispatch
}

export function ContextMenuContainer({dispatch}: AllProps) {
	return (
		<ContextMenu id={backgroundMenuId}>
			<MenuItem
				attributes={{
					className: 'contextMenuTop',
					title: 'shift + right click to get browser context menu',
				}}
				preventClose={true}
			>
				do stuff
			</MenuItem>
			<MenuItem onClick={(e) => {
				const newState = new BasicSynthesizerState(serverClientId)
				dispatch(addBasicSynthesizer(newState))
				createPosition(dispatch, newState, e)
			}}>
				Add Synth
			</MenuItem>
			<MenuItem onClick={(e) => {
				const newState = new BasicSamplerState(serverClientId)
				dispatch(addBasicSampler(newState))
				createPosition(dispatch, newState, e)
			}}>
				Add Piano Sampler
			</MenuItem>
			<MenuItem onClick={(e) => {
				const newState = new GridSequencerState(serverClientId, 'sally', 24, createSequencerEvents(32)
					.map((_, i) => (makeMidiClipEvent({
						notes: MidiNotes(i % 2 === 1 ? [] : [36]),
						startBeat: i,
						durationBeats: 1,
					}))))
				dispatch(addGridSequencer(newState))
				createPosition(dispatch, newState, e)
			}}>
				Add Grid Sequencer
			</MenuItem>
			<MenuItem onClick={(e) => {
				const newState = new InfiniteSequencerState(
					serverClientId,
					'bob',
					InfiniteSequencerStyle.colorGrid,
					createSequencerEvents(4)
						.map((_, i) => (makeMidiClipEvent({
							notes: MidiNotes(i % 2 === 1 ? [] : [36]),
							startBeat: i,
							durationBeats: 1,
						})))
				)
				dispatch(addInfiniteSequencer(newState))
				createPosition(dispatch, newState, e)
			}}>
				Add Infinite Sequencer
			</MenuItem>
			<MenuItem onClick={(e) => {
				const newState = new SimpleReverbState(serverClientId)
				dispatch(addSimpleReverb(newState))
				createPosition(dispatch, newState, e)
			}}>
				Add R E V E R B
			</MenuItem>
		</ContextMenu>
	)
}

function createPosition(dispatch: Dispatch, state: IConnectable, e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) {
	dispatch(addPosition(
		makePosition({
			id: state.id,
			targetType: state.type,
			width: state.width,
			height: state.height,
			...getPositionFromMouseOrTouchEvent(e)
		})
	))
}

function getPositionFromMouseOrTouchEvent(e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>): Point {
	const x = (e as MouseEvent).clientX || 0
	const y = (e as MouseEvent).clientY || 0
	return toGraphSpace(x, y)
}

function toGraphSpace(x = 0, y = 0): Readonly<Point> {
	const zoom = simpleGlobalClientState.zoom
	const pan = simpleGlobalClientState.pan

	return Object.freeze({
		x: ((x - (window.innerWidth / 2)) / zoom) - pan.x,
		y: ((y - (window.innerHeight / 2)) / zoom) - pan.y,
	})
}

export const ConnectedContextMenuContainer = shamuConnect()(ContextMenuContainer)
