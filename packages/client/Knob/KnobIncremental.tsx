import React from 'react'
import {incrementalRound} from '@corgifm/common/common-utils'
import './Knob.less'
import {KnobBaseProps} from './KnobTypes'
import {KnobValueNumber} from './KnobValueNumber'
import {KnobView} from './KnobView'
import {SliderControllerIncremental} from './SliderControllerIncremental'

interface Props extends KnobBaseProps {
	max: number
	min: number
	onChange: (onChangeId: any, newValue: number) => any
	defaultValue: number
	valueString?: (value: number) => string
	increment: number
	fineIncrement?: number
	value: number
	allowAltKey?: boolean
	sensitivity?: number
}

export const KnobIncremental = React.memo(function _KnobIncremental(props: Props) {
	const {
		value, label = '', readOnly = false, onChangeId,
		tooltip, valueString, onChange, allowAltKey, sensitivity,
		increment, fineIncrement, defaultValue, min, max,
	} = props

	const _handleOnChange = (newValue: number) => {
		onChange(onChangeId, newValue)
	}

	return (
		<SliderControllerIncremental
			min={min}
			max={max}
			onChange={_handleOnChange}
			value={value}
			defaultValue={defaultValue}
			increment={increment}
			fineIncrement={fineIncrement}
			allowAltKey={allowAltKey}
			sensitivity={sensitivity}
		>
			{(handleMouseDown, percentage, adjustedPercentage, isMouseDown) =>
				<KnobView
					percentage={percentage}
					label={label}
					readOnly={readOnly}
					handleMouseDown={handleMouseDown}
					tooltip={tooltip}
					canEdit={true}
					isMouseDown={isMouseDown}
				>
					<KnobValueNumber
						value={value}
						valueString={valueString}
						onValueChange={_handleOnChange}
						min={min}
						max={max}
						round={(v: number) => incrementalRound(v, fineIncrement !== undefined ? fineIncrement : increment)}
					/>
				</KnobView>
			}
		</SliderControllerIncremental>
	)
})
