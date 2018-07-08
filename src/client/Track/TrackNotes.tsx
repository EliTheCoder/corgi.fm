import * as React from 'react'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {IAppState} from '../../common/redux/configureStore'
import {ITrackEvent, selectTrack, setTrackBottomNote, setTrackNote} from '../../common/redux/tracks-redux'
import {MAX_MIDI_NOTE_NUMBER_127, MIN_MIDI_NOTE_NUMBER_0} from '../../common/server-constants'
import {isWhiteKey} from '../Keyboard/Keyboard'
import {VerticalScrollBar} from '../Knob/VerticalScrollBar'
import {isLeftMouseButtonDown} from '../utils'

interface ITrackNotesProps {
	events: ITrackEvent[]
	activeIndex: number
	bottomNote: number
	notesToShow: number
	handleNoteClicked: (index, isEnabled, i2) => void
	handleMouseEnter: (index, isEnabled, i2, e) => void
	handleMouseDown: (index, isEnabled, i2, e) => void
	handleScrollChange: (newValue: number) => void
}

export const TrackNotes = (props: ITrackNotesProps) => {
	const {activeIndex, bottomNote, events, handleNoteClicked,
		handleMouseEnter, handleMouseDown, notesToShow, handleScrollChange} = props

	const marks = events.reduce((allMarks: number[], event) => {
		return allMarks.concat(event.notes.map(note => note / 127))
	}, [])

	return (
		<div className="events">
			{events.map((event, index) => {
				const isActiveIndex = activeIndex === index
				return (
					<div
						key={index}
						className={`event ${isActiveIndex ? 'active' : 'transitionAllColor'}`}
					>
						{Array.apply(0, new Array(notesToShow)).map((_, i2) => {
							i2 += bottomNote
							const isEnabled = event.notes.some(x => x === i2)
							return (
								<div
									key={i2}
									className={`note ${isEnabled ? 'on' : ''} ${isWhiteKey(i2) ? 'white' : 'black'}`}
									onClick={() => handleNoteClicked(index, isEnabled, i2)}
									onMouseEnter={e => handleMouseEnter(index, isEnabled, i2, e)}
									onMouseDown={e => handleMouseDown(index, isEnabled, i2, e)}
								/>
							)
						})}
					</div>
				)
			})}
			<VerticalScrollBar
				min={MIN_MIDI_NOTE_NUMBER_0}
				max={MAX_MIDI_NOTE_NUMBER_127 - notesToShow}
				value={bottomNote}
				onChange={handleScrollChange}
				marks={marks}
				sliderGrabberHeightPercentage={notesToShow * 100 / MAX_MIDI_NOTE_NUMBER_127}
			/>
		</div>
	)
}

interface ITrackNotesConnectedProps {
	id: string
}

const mapSateToProps = (state: IAppState, props: ITrackNotesConnectedProps) => {
	const trackState = selectTrack(state, props.id)

	return {
		events: trackState.events,
		activeIndex: trackState.index,
		bottomNote: trackState.bottomNote,
		notesToShow: trackState.notesToShow,
	}
}

const mapDispatchToProps = (dispatch: Dispatch, {id}: ITrackNotesConnectedProps) => ({
	handleNoteClicked: (index: number, isEnabled: boolean, noteNumber: number) => {
		dispatch(setTrackNote(id, index, !isEnabled, noteNumber))
	},
	handleMouseEnter: (index: number, isEnabled: boolean, noteNumber: number, e) => {
		if (e.ctrlKey && isEnabled === true && isLeftMouseButtonDown(e.buttons)) {
			dispatch(setTrackNote(id, index, false, noteNumber))
		}
	},
	handleMouseDown: (index: number, isEnabled: boolean, noteNumber: number, e) => {
		if (e.ctrlKey && isEnabled === true && isLeftMouseButtonDown(e.buttons)) {
			dispatch(setTrackNote(id, index, false, noteNumber))
		}
	},
	handleScrollChange: (newValue: number) => {
		dispatch(setTrackBottomNote(id, Math.round(newValue)))
	},
})

export const TrackNotesConnected = connect(
	mapSateToProps,
	mapDispatchToProps,
)(TrackNotes)