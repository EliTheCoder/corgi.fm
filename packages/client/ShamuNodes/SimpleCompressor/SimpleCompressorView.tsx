import {stripIndents} from 'common-tags'
import React from 'react'
import {Dispatch} from 'redux'
import {
	findNodeInfo, selectSimpleCompressor, setSimpleCompressorParam,
	shamuConnect, SimpleCompressorParam,
} from '@corgifm/common/redux'
import {adsrValueToString} from '../../client-constants'
import {Knob} from '../../Knob/Knob'
import {Panel} from '../../Panel/Panel'

interface ISimpleCompressorProps {
	color: string
	id: Id
}

interface ISimpleCompressorReduxProps {
	isPlaying: boolean
	threshold: number
	knee: number
	ratio: number
	attack: number
	release: number
}

interface ISimpleCompressorDispatchProps {
	changeParam: (paramType: SimpleCompressorParam, value: number) => void
}

type ISimpleCompressorAllProps = ISimpleCompressorProps & ISimpleCompressorReduxProps & ISimpleCompressorDispatchProps

export const SimpleCompressorView: React.FC<ISimpleCompressorAllProps> =
	React.memo(function _SimpleCompressorView({id, color, isPlaying, threshold, knee, ratio, attack, release, changeParam}) {
		return (
			<Panel
				className={`${isPlaying ? 'isPlaying' : 'isNotPlaying'}`}
				id={id}
				color={color}
				saturate={isPlaying}
				label="Compressor"
			>
				<div
					style={{
						display: 'flex',
						flexDirection: 'row',
						width: '100%',
						justifyContent: 'space-around',
					}}
				>
					<Knob
						label="Thresh"
						min={-50}
						max={0}
						value={threshold}
						defaultValue={-24}
						onChange={changeParam}
						onChangeId={SimpleCompressorParam.threshold}
						tooltip={stripIndents`Threshold
							The decibel value above which the compression will start taking effect`}
					/>
					<Knob
						label="Knee"
						min={0}
						max={40}
						value={knee}
						defaultValue={30}
						onChange={changeParam}
						onChangeId={SimpleCompressorParam.knee}
						tooltip={stripIndents`Knee
							Decibel value representing the range above the threshold where the curve smoothly transitions to the compressed portion`}
					/>
					<Knob
						label="Ratio"
						min={1}
						max={20}
						value={ratio}
						defaultValue={12}
						onChange={changeParam}
						onChangeId={SimpleCompressorParam.ratio}
						tooltip={stripIndents`Ratio
							The amount of change, in dB, needed in the input for a 1 dB change in the output`}
					/>
					<Knob
						label="Attack"
						min={0}
						max={1}
						value={attack}
						defaultValue={0.003}
						onChange={changeParam}
						onChangeId={SimpleCompressorParam.attack}
						tooltip={stripIndents`Attack
							The amount of time, in seconds, required to reduce the gain by 10 dB`}
						valueString={adsrValueToString}
					/>
					<Knob
						label="Release"
						min={0.005}
						max={1}
						value={release}
						defaultValue={0.25}
						onChange={changeParam}
						onChangeId={SimpleCompressorParam.release}
						tooltip={stripIndents`Release
							The amount of time, in seconds, required to increase the gain by 10 dB`}
						valueString={adsrValueToString}
					/>
				</div>
			</Panel>
		)
	})

export const ConnectedSimpleCompressor = shamuConnect(
	(state, {id}: ISimpleCompressorProps): ISimpleCompressorReduxProps => {
		const simpleCompressorState = selectSimpleCompressor(state.room, id)

		return {
			isPlaying: findNodeInfo(simpleCompressorState.type)
				.selectIsPlaying(state.room, id),
			threshold: simpleCompressorState.threshold,
			knee: simpleCompressorState.knee,
			ratio: simpleCompressorState.ratio,
			attack: simpleCompressorState.attack,
			release: simpleCompressorState.release,
		}
	},
	(dispatch: Dispatch, {id}: ISimpleCompressorProps): ISimpleCompressorDispatchProps => ({
		changeParam: (paramType: SimpleCompressorParam, value: number) => dispatch(setSimpleCompressorParam(id, paramType, value)),
	}),
)(SimpleCompressorView)
