/* eslint-disable react/no-array-index-key */
import {stripIndents} from 'common-tags'
import React, {useLayoutEffect, useState, useCallback} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {Set} from 'immutable'
import {MidiClipEvents} from '@corgifm/common/midi-types'
import {IMidiNote} from '@corgifm/common/MidiNote'
import {
	infiniteSequencerActions, localActions,
	InfiniteSequencerStyle, selectInfiniteSequencer,
	shamuConnect, IClientAppState, selectPosition,
} from '@corgifm/common/redux'
import {getColorStringForMidiNote} from '@corgifm/common/shamu-color'
import {
	getOctaveFromMidiNote, midiNoteToNoteName, midiNoteToNoteNameFull,
} from '@corgifm/common/common-samples-stuff'
import {findLowestAndHighestNotes, clampMidiNote} from '@corgifm/common/common-utils'
import {isWhiteKey} from '../Keyboard/Keyboard'

interface Props {
	id: Id
}

interface ReduxProps {
	events: MidiClipEvents
	showRows: boolean
	style: InfiniteSequencerStyle
}

type AllProps = Props & ReduxProps

const sensitivity = 0.1
const threshold = 1
const notesPadding = 4
// const F = 'F'
// const E = 'E'
// const C = 'C'
// const B = 'B'

export function InfiniteSequencerNotes(
	{id, style, events, showRows}: AllProps
) {
	const dispatch = useDispatch()
	const [selectedEvent, setSelectedEvent] = useState({
		isSelected: false,
		index: -1,
	})
	const [isAreaSelected, setIsAreaSelected] = useState(false)

	const notesSectionHeight = useSelector(
		(state: IClientAppState) => selectPosition(state.room, id).height) - (notesPadding * 2)

	const [mouseDelta, setMouseDelta] = useState({x: 0, y: 0})

	const {lowestNote, highestNote} = findLowestAndHighestNotes(events.filter(x => x.note >= 0))
	const numberOfPossibleNotes = highestNote - lowestNote + 1
	const noteHeightPercentage = 100 / numberOfPossibleNotes
	const noteHeightPercentageDecimal = noteHeightPercentage / 100
	// const rows = new Array(highestNote - lowestNote + 1).fill(0).map((_, note) => ({
	// 	note,
	// 	isWhite: isWhiteKey(note),
	// 	noteName: midiNoteToNoteName(note),
	// }))

	useLayoutEffect(() => {
		const handleMouseMove = (event: MouseEvent) => {
			if (isAreaSelected && event.buttons !== 1) setIsAreaSelected(false)

			if (!selectedEvent.isSelected) return

			if (event.buttons !== 1 || !event.shiftKey) return setSelectedEvent({isSelected: false, index: -1})

			const newMouseDelta = {
				x: mouseDelta.x + event.movementX,
				y: mouseDelta.y - event.movementY,
			}

			const delta = newMouseDelta.y * sensitivity

			if (Math.abs(delta) > threshold) {
				const index = selectedEvent.index
				const oldNote = events.toList().get(index)!.note

				const newNote = clampMidiNote(oldNote + (delta > 0 ? 1 : -1))
				if (newNote !== oldNote) {
					dispatch(infiniteSequencerActions.setNote(id, selectedEvent.index, true, newNote))
					dispatch(localActions.playShortNote(id, Set([newNote])))
				}
				setMouseDelta({x: 0, y: 0})
			} else {
				setMouseDelta(newMouseDelta)
			}
		}

		if (selectedEvent.isSelected || isAreaSelected) {
			window.addEventListener('mousemove', handleMouseMove)
		}

		return () => {
			window.removeEventListener('mousemove', handleMouseMove)
		}
	}, [selectedEvent, mouseDelta, events, isAreaSelected, dispatch, id])

	const handleMouseDown: HandleMouseEvent = useCallback((event: React.MouseEvent, note: IMidiNote, index: number) => {
		if (event.button === 0) {
			setIsAreaSelected(true)

			if (note >= 0) {
				dispatch(localActions.playShortNote(id, Set([note])))
			}

			if (event.shiftKey) {
				if (note < 0) return

				setSelectedEvent({
					isSelected: true,
					index,
				})
			}
		} else if (event.button === 2) {
			if (event.shiftKey) {
				event.preventDefault()
				dispatch(infiniteSequencerActions.deleteNote(id, index))
			}
		}
	}, [dispatch, id])

	const handleMouseEnter: HandleMouseEvent = useCallback((event: React.MouseEvent, note: IMidiNote, index: number) => {
		if (event.buttons !== 1 || event.shiftKey || !isAreaSelected) return

		if (note >= 0) {
			dispatch(localActions.playShortNote(id, Set([note])))
		}
	}, [dispatch, isAreaSelected, id])

	if (style === InfiniteSequencerStyle.colorBars) {
		return (
			<div className={`display ${events.count() > 8 ? 'small' : ''}`}>
				<div className="notes">
					{events.toList().map(event => {
						const note = event.note

						return (
							<div
								key={event.id.toString()}
								className="event usernameFont colorBars"
								style={{
									backgroundColor: note === -1 ? 'none' : getColorStringForMidiNote(note),
									borderRadius: 4,
								}}
							>
								{note === -1
									? undefined
									: events.count() <= 8
										? midiNoteToNoteName(note) + getOctaveFromMidiNote(note).toString()
										: undefined
								}
							</div>
						)
					},
					)}
				</div>
			</div>
		)
	} else {
		return (
			<div className={`display ${events.count() > 8 ? 'small' : ''}`} style={{padding: 4}}>
				{/* Commented out because i can't get it to look right, need better solution
				{showRows &&
					<div className="rows">
						{rows.map(({note, isWhite, noteName}) => {
							const isLowestNote = note === lowestNote
							const isHighestNote = note === highestNote
							// const heightMultiplier = (noteName === C || noteName === F) && !isLowestNote
							// 	? 2
							// 	: (noteName === B || noteName === E) && !isHighestNote
							// 		? 0
							// 		: 1
							return (
								<div
									key={note}
									className={`row ${isWhite ? 'white' : 'black'}`}
									style={{
										height: Math.round(noteHeightPercentageDecimal * notesSectionHeight) * 1,
										top: `${(highestNote - note) * noteHeightPercentage}%`,
										width: '100%',
									}}
								/>
							)
						})}
					</div>
				} */}
				<div className="notes"/* style={{marginTop: showRows ? -notesSectionHeight : undefined}} */>
					{events.toList().map((event, index) =>
						<ColorGridNote
							note={event.note}
							index={index}
							key={event.id as string}
							height={Math.round(noteHeightPercentageDecimal * (notesSectionHeight)) /* + (event.note === lowestNote ? 1 : 0) */}
							top={((highestNote - event.note) * noteHeightPercentageDecimal) * (notesSectionHeight - 1)}
							onMouseDown={handleMouseDown}
							onMouseEnter={handleMouseEnter}
						/>
					)}
				</div>
			</div>
		)
	}
}

type HandleMouseEvent = (event: React.MouseEvent, note: IMidiNote, index: number) => void

const ColorGridNote = React.memo(
	function _ColorGridNote({note, index, height, top, onMouseDown, onMouseEnter}:
	{note: IMidiNote, index: number, height: number, top: number, onMouseDown: HandleMouseEvent, onMouseEnter: HandleMouseEvent},
	) {
		return (
			<div
				className="event"
				onMouseDown={e => onMouseDown(e, note, index)}
				onMouseEnter={e => onMouseEnter(e, note, index)}
				title={stripIndents`${midiNoteToNoteNameFull(note)}

					Left click and drag to play notes
					Shift + left click and drag up and down to change note
					Shift + right click to delete
					Ctrl + Z to undo (no redo (yet))`}
				onContextMenu={e => e.preventDefault()}
			>
				<div
					className="note"
					style={{
						backgroundColor: note === -1 ? 'none' : getColorStringForMidiNote(note),
						height,
						marginTop: Math.ceil(top),
					}}
				/>
			</div>
		)
	},
)

export const ConnectedInfiniteSequencerNotes = shamuConnect(
	(state, props: Props): ReduxProps => {
		const infiniteSequencerState = selectInfiniteSequencer(state.room, props.id)

		return {
			events: infiniteSequencerState.midiClip.events,
			showRows: infiniteSequencerState.showRows,
			style: infiniteSequencerState.style,
		}
	},
)(InfiniteSequencerNotes)
