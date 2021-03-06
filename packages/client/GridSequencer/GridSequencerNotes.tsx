/* eslint-disable react/no-array-index-key */
import {Set, List} from 'immutable'
import React from 'react'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {MAX_MIDI_NOTE_NUMBER_127, MIN_MIDI_NOTE_NUMBER_0} from '@corgifm/common/common-constants'
import {MidiClipEvents} from '@corgifm/common/midi-types'
import {IMidiNote, IMidiNotes} from '@corgifm/common/MidiNote'
import {
	gridSequencerActions, GridSequencerFields, IClientAppState,
	selectGlobalClockState, selectGridSequencer, GridSequencerState,
} from '@corgifm/common/redux'
import {getColorStringForMidiNote} from '@corgifm/common/shamu-color'
import {
	getOctaveFromMidiNote, midiNoteToNoteName,
} from '@corgifm/common/common-samples-stuff'
import {isLeftMouseButtonDown} from '../client-utils'
import {isWhiteKey} from '../Keyboard/Keyboard'
import {VerticalScrollBar} from '../Knob/VerticalScrollBar'

type GridSequencerEventHandler = (index: number, isEnabled: boolean, i2: number, e: React.MouseEvent) => void

type MouseEventHandler = (e: React.MouseEvent) => void

interface IGridSequencerNotesProps {
	id: Id
}

interface IGridSequencerNotesReduxProps {
	events: MidiClipEvents
	clipLengthBeats: number
	bottomNote: number
	notesToShow: number
}

interface IGridSequencerNotesDispatchProps {
	handleNoteClicked: GridSequencerEventHandler
	handleMouseEnter: GridSequencerEventHandler
	handleMouseDown: GridSequencerEventHandler
	handleScrollChange: (newValue: number) => void
}

type IGridSequencerNotesAllProps =
	IGridSequencerNotesProps & IGridSequencerNotesReduxProps & IGridSequencerNotesDispatchProps

export const GridSequencerNotes = (props: IGridSequencerNotesAllProps) => {
	const {
		clipLengthBeats, bottomNote, events, handleNoteClicked,
		handleMouseEnter, handleMouseDown, notesToShow, handleScrollChange,
	} = props

	const marks = events.reduce((allMarks, event) => {
		return allMarks.concat(event.note / 127)
	}, List<number>())

	const columns = new Array(clipLengthBeats).fill(0)

	return (
		<React.Fragment>
			<div className="noteNamesSidebar">
				{new Array(notesToShow).fill(0).map((_, i) => {
					const note = i + bottomNote
					const noteName = midiNoteToNoteName(note)
					return (
						<div
							key={i}
							className={`noteName ${isWhiteKey(note) ? 'white' : 'black'} ${noteName.toLowerCase() === 'c' ? 'c' : ''}`}
						>
							{noteName + getOctaveFromMidiNote(note).toString()}
						</div>
					)
				})}
			</div>
			<div className="eventsBox">
				<div className="pianoRoll">
					{new Array(notesToShow).fill(0).map((_, i) => {
						const note = i + bottomNote
						return <div
							key={i}
							className={`row ${isWhiteKey(note) ? 'white' : 'black'}`}
						/>
					})}
				</div>
				<div className="events">
					{columns.map((_, eventIndex) => {
						return <Event
							key={eventIndex}
							notes={Set(events.filter(x => x.startBeat === eventIndex).map(x => x.note).valueSeq())}
							eventIndex={eventIndex}
							notesToShow={notesToShow}
							bottomNote={bottomNote}
							handleNoteClicked={handleNoteClicked}
							handleMouseEnter={handleMouseEnter}
							handleMouseDown={handleMouseDown}
						/>
					})}
				</div>
			</div>
			<VerticalScrollBar
				min={MIN_MIDI_NOTE_NUMBER_0}
				max={MAX_MIDI_NOTE_NUMBER_127 - notesToShow}
				value={bottomNote}
				onChange={handleScrollChange}
				marks={marks}
				sliderGrabberHeightPercentage={notesToShow * 100 / MAX_MIDI_NOTE_NUMBER_127}
			/>
		</React.Fragment>
	)
}

interface IEventProps {
	notes: IMidiNotes
	eventIndex: number
	notesToShow: number
	bottomNote: number
	handleNoteClicked: GridSequencerEventHandler
	handleMouseEnter: GridSequencerEventHandler
	handleMouseDown: GridSequencerEventHandler
}

class Event extends React.PureComponent<IEventProps> {
	public render() {
		const {eventIndex, notesToShow} = this.props

		const placeholderNotesArray = Array.apply(0, new Array(notesToShow))

		return (
			<div
				key={eventIndex}
				className={`event`}
			>
				{placeholderNotesArray.map(this._renderNote)}
			</div>
		)
	}

	private readonly _renderNote = (_: any, i: number) => {
		const note = i + this.props.bottomNote
		const isEnabled = this.props.notes.includes(note)
		return <Note
			key={note}
			note={note}
			eventIndex={this.props.eventIndex}
			isEnabled={isEnabled}
			onClick={this.props.handleNoteClicked}
			onMouseEnter={this.props.handleMouseEnter}
			onMouseDown={this.props.handleMouseDown}
		/>
	}
}

interface INoteProps {
	note: number
	eventIndex: number
	isEnabled: boolean
	onClick: GridSequencerEventHandler
	onMouseEnter: GridSequencerEventHandler
	onMouseDown: GridSequencerEventHandler
}

class Note extends React.PureComponent<INoteProps> {
	public render() {
		const {note, isEnabled} = this.props

		return <div
			className={`note ${isEnabled ? 'on' : ''} ${isWhiteKey(note) ? 'white' : 'black'}`}
			onClick={this._onClick}
			onMouseEnter={this._onMouseEnter}
			onMouseDown={this._onMouseDown}
			style={{
				color: getColorStringForMidiNote(note),
				borderRadius: 4,
			}}
		/>
	}

	private readonly _onClick: MouseEventHandler = e =>
		this.props.onClick(this.props.eventIndex, this.props.isEnabled, this.props.note, e)

	private readonly _onMouseEnter: MouseEventHandler = e =>
		this.props.onMouseEnter(this.props.eventIndex, this.props.isEnabled, this.props.note, e)

	private readonly _onMouseDown: MouseEventHandler = e =>
		this.props.onMouseDown(this.props.eventIndex, this.props.isEnabled, this.props.note, e)
}

const mapStateToProps = (state: IClientAppState, props: IGridSequencerNotesProps): IGridSequencerNotesReduxProps => {
	const gridSequencerState = selectGridSequencer(state.room, props.id)

	return {
		events: gridSequencerState.midiClip.events,
		clipLengthBeats: gridSequencerState.midiClip.length,
		bottomNote: gridSequencerState.scrollY,
		notesToShow: GridSequencerState.notesToShow,
	}
}

const mapDispatchToProps = (dispatch: Dispatch, {id}: IGridSequencerNotesProps): IGridSequencerNotesDispatchProps => {
	const onMouse: GridSequencerEventHandler = (index, isEnabled, noteNumber, e) => {
		if (e.shiftKey && e.altKey && isLeftMouseButtonDown(e.buttons)) {
			dispatch(gridSequencerActions.setNote(id, index, !isEnabled, noteNumber))
		} else if (e.shiftKey && isEnabled === true && isLeftMouseButtonDown(e.buttons)) {
			dispatch(gridSequencerActions.setNote(id, index, false, noteNumber))
		} else if (e.altKey && isEnabled === false && isLeftMouseButtonDown(e.buttons)) {
			dispatch(gridSequencerActions.setNote(id, index, true, noteNumber))
		}
	}

	return {
		handleNoteClicked: (index, isEnabled, noteNumber) => {
			dispatch(gridSequencerActions.setNote(id, index, !isEnabled, noteNumber))
		},
		handleMouseEnter: onMouse,
		handleMouseDown: onMouse,
		handleScrollChange: newValue => {
			dispatch(gridSequencerActions.setField(id, GridSequencerFields.scrollY, Math.round(newValue)))
		},
	}
}

export const GridSequencerNotesConnected = connect(
	mapStateToProps,
	mapDispatchToProps,
)(GridSequencerNotes)
