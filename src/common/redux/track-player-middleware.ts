import {AnyAction, Dispatch, Middleware, Store} from 'redux'
import {audioContext} from '../../client/setup-audio-context'
import {TrackPlayer} from '../../client/TrackPlayer'
import {makeActionCreator, makeBroadcaster, makeServerAction} from './redux-utils'
import {selectTrack, setTrackIndex} from './tracks-redux'

export const PLAY_TRACK = 'PLAY_TRACK'
export const playTrack = makeServerAction(makeBroadcaster(makeActionCreator(PLAY_TRACK, 'id')))

export const STOP_TRACK = 'STOP_TRACK'
export const stopTrack = makeServerAction(makeBroadcaster(makeActionCreator(STOP_TRACK, 'id')))

export const TOGGLE_PLAY_TRACK = 'TOGGLE_PLAY_TRACK'
export const togglePlayTrack = makeActionCreator(TOGGLE_PLAY_TRACK, 'id')

export const RESTART_TRACK = 'RESTART_TRACK'
export const restartTrack = makeBroadcaster(makeActionCreator(RESTART_TRACK, 'id'))

export const REFRESH_TRACK_PLAYER_EVENTS = 'REFRESH_TRACK_PLAYER_EVENTS'
export const refreshTrackPlayerEvents = makeBroadcaster(makeActionCreator(REFRESH_TRACK_PLAYER_EVENTS, 'id'))

interface ITrackPlayers {
	[trackId: string]: TrackPlayer
}

const trackPlayers: ITrackPlayers = {}

export const trackPlayerMiddleware: Middleware = (store: Store) => next => action => {
	switch (action.type) {
		case PLAY_TRACK:
		case STOP_TRACK:
		case TOGGLE_PLAY_TRACK:
		case RESTART_TRACK:
			// case REFRESH_TRACK_PLAYER_EVENTS:
			let trackPlayer = trackPlayers[action.id]
			if (trackPlayer === undefined) {
				trackPlayers[action.id] = new TrackPlayer(
					audioContext,
					index => store.dispatch(setTrackIndex(action.id, index)),
				)
				trackPlayer = trackPlayers[action.id]
			}
			return foo(action, trackPlayer, next, store)
		default:
			return next(action)
	}
}

function foo(action: AnyAction, trackPlayer: TrackPlayer, next: Dispatch, store: Store) {
	switch (action.type) {
		case PLAY_TRACK:
			trackPlayer.play(selectTrack(store.getState(), action.id).notes.length)
			return next(action)
		case STOP_TRACK:
			trackPlayer.stop()
			return next(action)
		case TOGGLE_PLAY_TRACK:
			if (trackPlayer.isPlaying()) {
				trackPlayer.stop()
				next(stopTrack())
			} else {
				trackPlayer.play(selectTrack(store.getState(), action.id).notes.length)
				next(playTrack())
			}
			return next(action)
		case RESTART_TRACK:
			if (trackPlayer.isPlaying()) {
				trackPlayer.stop()
				trackPlayer.play(selectTrack(store.getState(), action.id).notes.length)
			}
			return next(action)
		// case REFRESH_TRACK_PLAYER_EVENTS:
		// 	next(action)
		// 	trackPlayer.setEvents(selectTrack(store.getState(), action.id).notes.length)
		// 	return
		default:
			throw new Error('invalid track player action type')
	}
}

// function notesToEvents(events: ITrackEvent[]): ISimpleTrackEvent[] {
// 	return events.reduce((newEvents, event, index) => {
// 		newEvents.push({
// 			time: index / 5,
// 			action: SimpleTrackEventAction.playNote,
// 			notes: event.notes,
// 		})
// 		newEvents.push({
// 			time: (index / 5) + (1 / 5),
// 			action: SimpleTrackEventAction.stopNote,
// 			notes: event.notes,
// 		})
// 		return newEvents
// 	}, []).concat({time: events.length / 5, action: SimpleTrackEventAction.endTrack, notes: []})
// }
