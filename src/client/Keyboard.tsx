import hashbow from 'hashbow'
import * as React from 'react'
import {connect} from 'react-redux'
import './Keyboard.css'
import {IAppState} from './redux/configureStore'
import {Octave} from './redux/midi-redux'
import {keyToMidiMap} from './redux/virtual-midi-keyboard-middleware'
import {ClientId} from './websocket'

const keyColors = Object.freeze({
	0: {color: 'white', name: 'C'},
	1: {color: 'black', name: 'C#'},
	2: {color: 'white', name: 'D'},
	3: {color: 'black', name: 'D#'},
	4: {color: 'white', name: 'E'},
	5: {color: 'white', name: 'F'},
	6: {color: 'black', name: 'F#'},
	7: {color: 'white', name: 'G'},
	8: {color: 'black', name: 'G#'},
	9: {color: 'white', name: 'A'},
	10: {color: 'black', name: 'A#'},
	11: {color: 'white', name: 'B'},
})

// const numberToKeyboardKeyNameMap = Object.freeze({
// 	0: '',
// 	1: '',
// 	2: '',
// 	3: '',
// 	4: '',
// 	5: '',
// 	6: '',
// 	7: '',
// 	8: '',
// 	9: '',
// 	10: '',
// 	11: '',
// })

const defaultNumberOfKeys = 13

const virtualMidiKeyboard = createVirtualMidiKeyboard(defaultNumberOfKeys)

function createVirtualMidiKeyboard(numberOfKeys: number) {
	const newVirtualMidiKeyboard = []

	for (let i = 0; i < numberOfKeys; i++) {
		const baseNumber = i % 12
		newVirtualMidiKeyboard[i] = {
			...keyColors[baseNumber],
			keyName: Object.keys(keyToMidiMap)[i],
		}
	}

	return newVirtualMidiKeyboard
}

interface IKeyboardProps {
	ownerId: ClientId,
	pressedMidiKeys?: any,
	octave?: Octave
}

function boxShadow3dCss(size: number, color: string) {
	let x = ''

	for (let i = 0; i < size; i++) {
		x += `${-i + 0}px ${i + 2}px ${color},`
	}

	return x.replace(/,$/, '')

	/*
	0px 1px #999,
	-1px 2px #999,
	-2px 3px #999,
	-3px 4px #999,
	-4px 5px #999,
	-5px 6px #999;
	*/
}

export class Keyboard extends React.Component<IKeyboardProps> {
	public static defaultProps = {
		pressedMidiKeys: [],
	}

	public render() {
		const {pressedMidiKeys, octave, ownerId} = this.props
		const specialColor = hashbow(ownerId, 60, 60)
		return (
			<div className="keyboard" style={{boxShadow: boxShadow3dCss(8, specialColor)}}>
				<div className="octave">
					{octave || '?'}
				</div>
				{virtualMidiKeyboard.map((value, index) => {
					const isKeyPressed = pressedMidiKeys.some(x => (x % 12) === index)

					return (
						<div
							key={index}
							className={'key ' + value.color}
							style={{backgroundColor: isKeyPressed ? specialColor : ''}}
						>
							<div className="noteName">
								{value.name}
							</div>
							<div className="keyName">
								{value.keyName}
							</div>

						</div>
					)
				})}
			</div>
		)
	}
}

const mapStateToProps = (state: IAppState, props) => ({
	pressedMidiKeys: state.virtualKeyboards[props.ownerId] && state.virtualKeyboards[props.ownerId].pressedKeys,
})

export const ConnectedKeyboard = connect(mapStateToProps)(Keyboard)