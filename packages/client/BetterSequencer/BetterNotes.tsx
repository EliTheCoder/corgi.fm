import React, {useState, useCallback, useLayoutEffect} from 'react'
import {useDispatch} from 'react-redux'
import {Set} from 'immutable'
import {MidiClip, MidiClipEvents} from '@corgifm/common/midi-types'
import {betterSequencerActions, sequencerActions} from '@corgifm/common/redux'
import {smallestNoteLength} from '@corgifm/common/BetterConstants'
import {sumPoints} from '@corgifm/common/common-utils'
import {MIN_MIDI_NOTE_NUMBER_0, MAX_MIDI_NOTE_NUMBER_127} from '@corgifm/common/common-constants'
import {BetterNote} from './BetterNote'
import {movementXToBeats, movementToBeats, movementYToNote} from './BetterSequencerHelpers'

interface Props {
	id: Id
	noteHeight: number
	columnWidth: number
	panPixels: Point
	midiClip: MidiClip
	selected: Set<Id>
	onNoteSelect: (eventId: Id, select: boolean, clear: boolean) => void
	clearSelected: () => void
	lengthBeats: number
	zoom: Point
	width: number
	height: number
	rows: string[]
}

export const BetterNotes = (props: Props) => {
	const {
		id, panPixels, noteHeight, columnWidth, selected, onNoteSelect,
		clearSelected, midiClip, lengthBeats, zoom, width, height, rows,
	} = props

	const [noteResizeActive, setNoteResizeActive] = useState<false | 'left' | 'right'>(false)
	const [noteMoveActive, setNoteMoveActive] = useState(false)
	const [persistentDelta, setPersistentDelta] = useState({x: 0, y: 0})
	const [startEvents, setStartEvents] = useState(MidiClipEvents())

	const dispatch = useDispatch()

	const resizeNotes = useCallback((movementX: number) => {
		if (!noteResizeActive) return

		const newPersistentDelta = {x: persistentDelta.x + movementX, y: 0}
		const direction = noteResizeActive === 'left' ? -1 : 1
		const doo = movementXToBeats(newPersistentDelta.x, lengthBeats, zoom.x, width) * direction

		const updatedEvents = startEvents.map(event => {
			return {
				...event,
				durationBeats: Math.max(smallestNoteLength, Math.min(lengthBeats, event.durationBeats + doo)),
				startBeat: noteResizeActive === 'left'
					? Math.min(event.startBeat + event.durationBeats, event.startBeat - doo)
					: event.startBeat,
			}
		})

		dispatch(betterSequencerActions.updateEvents(id, updatedEvents, false))
		setPersistentDelta(newPersistentDelta)
	}, [noteResizeActive, persistentDelta, lengthBeats, zoom.x, width, startEvents, dispatch, id])

	const moveNotes = useCallback((movement: Point) => {
		if (!noteMoveActive) return

		const newPersistentDelta = sumPoints(persistentDelta, movement)
		const beatDelta = movementXToBeats(newPersistentDelta.x, lengthBeats, zoom.x, width)
		const noteDelta = movementYToNote(newPersistentDelta.y, rows, zoom.y, height)

		const updatedEvents = startEvents.map(event => {
			return {
				...event,
				startBeat: Math.max(0, Math.min(lengthBeats - smallestNoteLength, event.startBeat + beatDelta)),
				note: Math.max(MIN_MIDI_NOTE_NUMBER_0, Math.min(MAX_MIDI_NOTE_NUMBER_127, Math.round(event.note - noteDelta))),
			}
		})

		dispatch(betterSequencerActions.updateEvents(id, updatedEvents, false))
		setPersistentDelta(newPersistentDelta)
	}, [noteMoveActive, persistentDelta, lengthBeats, zoom.x, zoom.y, width, rows, height, startEvents, dispatch, id])

	const startNoteResizing = useCallback((direction: 'left' | 'right') => {
		setNoteResizeActive(direction)
	}, [])

	const stopNoteResizing = useCallback(() => {
		setNoteResizeActive(false)
	}, [])

	const startNoteMoving = useCallback(() => {
		setNoteMoveActive(true)
	}, [])

	const stopNoteMoving = useCallback(() => {
		setNoteMoveActive(false)
	}, [])

	const handleMouseDown = useCallback((e: MouseEvent, direction: 'left' | 'right' | 'center', eventId: Id) => {
		dispatch(sequencerActions.saveUndo(id))
		setPersistentDelta({x: 0, y: 0})
		if (!selected.has(eventId)) {
			if (e.shiftKey) {
				onNoteSelect(eventId, true, false)
				setStartEvents(midiClip.events.filter(x => selected.has(x.id) || x.id === eventId))
			} else {
				onNoteSelect(eventId, true, true)
				setStartEvents(midiClip.events.filter(x => x.id === eventId))
			}
		} else {
			setStartEvents(midiClip.events.filter(x => selected.has(x.id)))
		}
		if (direction !== 'center') {
			startNoteResizing(direction)
		} else {
			startNoteMoving()
		}
	}, [dispatch, id, midiClip.events, onNoteSelect, selected, startNoteMoving, startNoteResizing])

	// Note mouse resize
	useLayoutEffect(() => {
		const stopActive = () => {
			if (noteResizeActive) return stopNoteResizing()
			if (noteMoveActive) return stopNoteMoving()
		}

		const onMouseMove = (e: MouseEvent) => {
			if (e.buttons !== 1) return stopActive()
			if (noteResizeActive) return resizeNotes(e.movementX)
			if (noteMoveActive) return moveNotes(getMovement(e))
		}

		if (noteResizeActive || noteMoveActive) {
			window.addEventListener('mousemove', onMouseMove)
			window.addEventListener('mouseup', stopActive)
		}

		return () => {
			window.removeEventListener('mousemove', onMouseMove)
			window.removeEventListener('mouseup', stopActive)
		}
	}, [resizeNotes, noteMoveActive, noteResizeActive, stopNoteMoving, stopNoteResizing, moveNotes])

	return (
		<div
			className={`notes active-${noteResizeActive}`}
		>
			<div
				className="scalable"
				style={{
					transform: `translate(${-panPixels.x}px, ${-panPixels.y}px)`,
				}}
				onMouseDown={e => {
					if (e.button !== 0 || e.shiftKey) return
					clearSelected()
				}}
			>
				{midiClip.events.map(event => {
					return (
						<BetterNote
							key={event.id.toString()}
							{...{
								id,
								event,
								noteHeight,
								columnWidth,
								isSelected: selected.has(event.id),
								panPixels,
								onNoteSelect,
								handleMouseDown,
							}}
						/>
					)
				}).toList()}
			</div>
		</div>
	)
}

function getMovement(e: MouseEvent) {
	return {
		x: e.movementX,
		y: e.movementY,
	} as const
}
