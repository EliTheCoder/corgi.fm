import {logger} from '../common/logger'
import {configureStore, IAppState} from '../common/redux/configureStore'
import {getInitialReduxState} from '../common/redux/initial-redux-state'
import {setupInputEventListeners} from './input-events'
import {renderApp} from './react-main'
import {setupAudioContext} from './setup-audio-context'
import {setupMidiSupport} from './setup-midi-support'
import {setupWebsocketAndListeners} from './websocket-listeners'

const store = configureStore(getInitialReduxState())

setupAudioContext(store)

setupMidiSupport(store, logger)

setupInputEventListeners(window, store)

setupWebsocketAndListeners(store)

renderApp(store)

declare global {
	interface NodeModule {
		hot: {
			dispose: (_: () => any) => any,
			accept: (_: () => any) => any,
		}
	}
}

if (module.hot) {
	const state: IAppState = store.getState()

	module.hot.accept(() => renderApp(store))

	module.hot.dispose(() => state.websocket.socket.disconnect())
	module.hot.dispose(() => state.audio.context.close())
}