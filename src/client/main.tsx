import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {hot} from 'react-hot-loader'
import {Provider} from 'react-redux'
import Reverb from 'soundbank-reverb'
import {ConnectedApp} from './App'
import {setupInputEventListeners} from './input-events'
import {configureStore, IAppState} from './redux/configureStore'
import {setupWebsocket} from './websocket'

const defaultMasterVolume = 0.1

// Might be needed for safari
// const AudioContext = window.AudioContext || window.webkitAudioContext
const audioContext = new AudioContext()

const preFx = audioContext.createGain()
const master = audioContext.createGain()

const store = configureStore({
	audio: {
		context: audioContext,
		preFx,
		masterVolume: getMasterVolumeFromStorageOrDefault(),
	},
})

function getMasterVolumeFromStorageOrDefault() {
	if (window.localStorage.masterVolume) {
		if (parseFloat(window.localStorage.masterVolume)) {
			return parseFloat(window.localStorage.masterVolume)
		}
	}

	return defaultMasterVolume
}

let previousMasterVolume

store.subscribe(() => {
	const state: IAppState = store.getState()
	const newVolume = state.audio.masterVolume
	if (previousMasterVolume !== newVolume) {
		master.gain.value = state.audio.masterVolume
		window.localStorage.masterVolume = state.audio.masterVolume
	}
	previousMasterVolume = newVolume
})

setupInputEventListeners(window, store)

const reverbHigh = Reverb(audioContext)
reverbHigh.time = 1
reverbHigh.cutoff.value = 5000

const reverb = Reverb(audioContext)
reverb.time = 5
reverb.cutoff.value = 2000

const reverbLowAndLong = Reverb(audioContext)
reverbLowAndLong.time = 30
reverbLowAndLong.cutoff.value = 150

preFx.connect(reverbHigh)
	.connect(master)
preFx.connect(reverb)
	.connect(master)
preFx.connect(reverbLowAndLong)
	.connect(master)

master.connect(audioContext.destination)

preFx.gain.value = 0.5

const socket = setupWebsocket(store)

declare global {
	interface NodeModule {
		hot: {
			dispose: (_: () => any) => any,
			accept: (_: () => any) => any,
		}
	}
}

if (module.hot) {
	module.hot.dispose(() => {
		socket.disconnect()
	})
}

renderApp()

module.hot.accept(renderApp)

function renderApp() {
	const HotProvider = hot(module)(Provider)
	ReactDOM.render(
		<HotProvider store={store}>
			<ConnectedApp />
		</HotProvider>,
		document.getElementById('react-app'),
	)
}
