import * as Immutable from 'immutable'
import {Store} from 'redux'
import {ConnectionNodeType, IConnectable} from '../common/common-types'
import {logger} from '../common/logger';
import {IClientAppState, IClientRoomState} from '../common/redux'
import {setGlobalClockIndex} from '../common/redux'
import {
	selectConnectionSourceNotesByTargetId,
} from '../common/redux'
import {
	BasicSynthesizerState, IConnection, isAudioNodeType, MASTER_AUDIO_OUTPUT_TARGET_ID, selectAllBasicSynthesizerIds, selectAllSimpleReverbIds, selectBasicSynthesizer, selectConnectionsWithSourceIds, selectSimpleReverb, SimpleReverbState,
} from '../common/redux'
import {BasicSamplerState, selectAllSamplerIds, selectSampler} from '../common/redux'
import {BasicSamplerInstrument} from './BasicSampler/BasicSamplerInstrument'
import {GridSequencerPlayer} from './GridSequencerPlayer'
import {BasicSynthesizer} from './Instruments/BasicSynthesizer'
import {IAudioNodeWrapper, IAudioNodeWrapperOptions, IInstrument, IInstrumentOptions} from './Instruments/Instrument'
import {SimpleReverb} from './ShamuNodes/SimpleReverb/SimpleReverb'

type IdsSelector = (roomState: IClientRoomState) => string[]
type StateSelector<S> = (roomState: IClientRoomState, id: string) => S

type InstrumentFactory<I extends IInstrument, S> = (options: IInstrumentOptions, instrumentState: S) => I
type UpdateSpecificInstrument<I extends IInstrument, S> = (instrument: I, instrumentState: S) => void

type EffectFactory<E, S> = (options: IAudioNodeWrapperOptions, effectState: S) => E
type UpdateSpecificEffect<E, S> = (effect: E, effectState: S) => void

class StuffMap extends Map<string, IAudioNodeWrapper> {}

// Need separate properties to match up with what IDs selector is used
// so that we can delete stuff properly
const stuffMaps: {[key: string]: StuffMap} = Object.freeze({
	[ConnectionNodeType.basicSampler]: new StuffMap(),
	[ConnectionNodeType.basicSynthesizer]: new StuffMap(),
	[ConnectionNodeType.audioOutput]: new StuffMap(),
	[ConnectionNodeType.simpleReverb]: new StuffMap(),
})

export const setupInstrumentManager =
	(store: Store<IClientAppState>, audioContext: AudioContext, preFx: GainNode) => {

		stuffMaps[ConnectionNodeType.audioOutput].set(
			MASTER_AUDIO_OUTPUT_TARGET_ID,
			{
				getInputAudioNode: () => preFx,
				getOutputAudioNode: () => preFx,
				connect: () => null,
				disconnect: () => null,
				disconnectAll: () => null,
				getConnectedTargets: () => Immutable.Map(),
				dispose: () => null,
			},
		)

		const globalClock = new GridSequencerPlayer(
			audioContext,
			index => store.dispatch(setGlobalClockIndex(index)),
		)

		globalClock.play()

		store.subscribe(updateInstrumentLayer)

		function updateInstrumentLayer() {
			const state = store.getState()

			handleSamplers()
			handleBasicSynthesizers()
			handleSimpleReverbs()

			function handleSamplers() {
				updateInstrumentType(
					selectAllSamplerIds,
					selectSampler,
					options => new BasicSamplerInstrument({
						...options,
						voiceCount: 20,
					}),
					stuffMaps[ConnectionNodeType.basicSampler],
					(instrument: BasicSamplerInstrument, instrumentState: BasicSamplerState) => {
						instrument.setPan(instrumentState.pan)
						instrument.setLowPassFilterCutoffFrequency(instrumentState.lowPassFilterCutoffFrequency)
						instrument.setAttack(instrumentState.attack)
						instrument.setRelease(instrumentState.release)
					},
				)
			}

			function handleBasicSynthesizers() {
				updateInstrumentType(
					selectAllBasicSynthesizerIds,
					selectBasicSynthesizer,
					(options, instrumentState) => new BasicSynthesizer({
						...options,
						voiceCount: 9,
						...instrumentState,
					}),
					stuffMaps[ConnectionNodeType.basicSynthesizer],
					(instrument: BasicSynthesizer, instrumentState: BasicSynthesizerState) => {
						instrument.setOscillatorType(instrumentState.oscillatorType)
						instrument.setPan(instrumentState.pan)
						instrument.setLowPassFilterCutoffFrequency(instrumentState.lowPassFilterCutoffFrequency)
						instrument.setAttack(instrumentState.attack)
						instrument.setRelease(instrumentState.release)
						instrument.setFineTuning(instrumentState.fineTuning)
					},
				)
			}

			function updateInstrumentType<I extends IInstrument, S extends IConnectable>(
				instrumentIdsSelector: IdsSelector,
				instrumentStateSelector: StateSelector<S>,
				instrumentCreator: InstrumentFactory<I, S>,
				stuff: StuffMap,
				updateSpecificInstrument?: UpdateSpecificInstrument<I, S>,
			) {
				const instrumentIds = instrumentIdsSelector(state.room)

				stuff.forEach((_, key) => {
					if (instrumentIds.includes(key) === false) {
						stuff.get(key)!.dispose()
						stuff.delete(key)
					}
				})

				instrumentIds.forEach(instrumentId => {
					const instrumentState = instrumentStateSelector(state.room, instrumentId)

					const instrument = createIfNotExisting(
						stuff,
						instrumentId,
						stuff.get(instrumentId),
						() => instrumentCreator({
							audioContext,
							voiceCount: 1,
						}, instrumentState),
					)

					updateAudioConnectionsFromSource(state.room, instrumentId, instrument)

					const sourceNotes = selectConnectionSourceNotesByTargetId(state.room, instrumentId)

					instrument.setMidiNotes(sourceNotes)

					if (updateSpecificInstrument) updateSpecificInstrument(instrument, instrumentState)
				})
			}

			function handleSimpleReverbs() {
				updateEffectType(
					selectAllSimpleReverbIds,
					selectSimpleReverb,
					(options, effectState) => new SimpleReverb({
						...options,
						...effectState,
					}),
					stuffMaps[ConnectionNodeType.simpleReverb],
					(effect: SimpleReverb, effectState: SimpleReverbState) => {
						effect.setTime(effectState.time)
						effect.setCutoff(effectState.lowPassFilterCutoffFrequency)
					},
				)
			}

			function updateEffectType<E extends IAudioNodeWrapper, S extends IConnectable>(
				effectIdsSelector: IdsSelector,
				effectStateSelector: StateSelector<S>,
				effectCreator: EffectFactory<E, S>,
				stuff: StuffMap,
				updateSpecificEffect?: UpdateSpecificEffect<E, S>,
			) {
				const effectIds = effectIdsSelector(state.room)

				stuff.forEach((_, key) => {
					if (effectIds.includes(key) === false) {
						stuff.get(key)!.dispose()
						stuff.delete(key)
					}
				})

				effectIds.forEach(effectId => {
					const effectState = effectStateSelector(state.room, effectId)

					const effect = createIfNotExisting(
						stuff,
						effectId,
						stuff.get(effectId),
						() => effectCreator({
							audioContext,
						}, effectState),
					)

					updateAudioConnectionsFromSource(state.room, effectId, effect)

					if (updateSpecificEffect) updateSpecificEffect(effect, effectState)
				})
			}
		}
	}

function updateAudioConnectionsFromSource(roomState: IClientRoomState, sourceId: string, audioNodeWrapper: IAudioNodeWrapper) {
	const outgoingConnections = selectConnectionsWithSourceIds(roomState, [sourceId])

	if (outgoingConnections.count() === 0) {
		return audioNodeWrapper.disconnectAll()
	}

	const validOutgoingConnections = outgoingConnections.filter(isConnectionToAudioNode)
	const newConnections = validOutgoingConnections.filter(x => audioNodeWrapper.getConnectedTargets().has(x.targetId) === false)
	const deletedTargetIds = audioNodeWrapper.getConnectedTargets().keySeq().filter(id => validOutgoingConnections.some(x => x.targetId === id) === false)

	newConnections.forEach(newConnection => {
		const targetAudioNodeWrapper = stuffMaps[newConnection.targetType].get(newConnection.targetId)
		if (!targetAudioNodeWrapper) return
		audioNodeWrapper.connect(targetAudioNodeWrapper, newConnection.targetId)
	})

	deletedTargetIds.forEach(deletedTargetId => {
		audioNodeWrapper.disconnect(deletedTargetId)
	})
}

function createIfNotExisting<T>(stuff: StuffMap, id: string, thing: any, thingFactory: () => T): T {
	if (thing === undefined) {
		thing = thingFactory()
		stuff.set(id, thing)
	}
	return thing
}

function isConnectionToAudioNode(connection: IConnection) {
	return isAudioNodeType(connection.targetType)
}
