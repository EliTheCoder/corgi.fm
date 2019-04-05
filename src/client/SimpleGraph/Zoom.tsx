import * as React from 'react'
import {selectOptions} from '../../common/redux'
import {shamuConnect} from '../../common/redux'
import PlusSVG from '../OtherSVG/plus.svg'
import {simpleGlobalClientState} from '../SimpleGlobalClientState'
import {zoomBackgroundClass, backgroundMenuId} from '../client-constants'
import {ContextMenuTrigger} from 'react-contextmenu'

interface IZoomProps {
	children: React.ReactNode
}

interface IZoomReduxProps {
	requireCtrlToZoom: boolean
}

type IZoomAllProps = IZoomProps & IZoomReduxProps

interface IZoomState {
	zoom: number
	pan: {
		x: number,
		y: number,
	}
	backgroundClicked: boolean
}

const maxZoom = 10
const minZoom = 0.1
const scrollZoomMod = 0.001
const mouseZoomMod = 0.001
const mousePanMod = 1
const maxPan = 1000
// const zoomTextLength = Math.max(scrollZoomMod.toString().length, mouseZoomMod.toString().length)

const bgSize = 10000

export class Zoom extends React.PureComponent<IZoomAllProps, IZoomState> {
	public state = {
		zoom: 1,
		pan: {
			x: 0,
			y: 0,
		},
		backgroundClicked: false,
	}

	public componentDidMount() {
		window.addEventListener('wheel', this._onMouseWheel, {passive: false})
		window.addEventListener('mousemove', this._onMouseMove)
	}

	public componentWillUnmount() {
		window.removeEventListener('wheel', this._onMouseWheel)
		window.removeEventListener('mousemove', this._onMouseMove)
		simpleGlobalClientState.zoom = 1
		simpleGlobalClientState.pan = {x: 0, y: 0}
	}

	public render() {
		const {children} = this.props
		const {zoom, pan} = this.state

		return (
			<div
				className="zoom"
				style={{
					transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
					willChange: 'transform',
				}}
			>
				<ZoomBackground
					onMouseEvent={this._onBgMouseEvent}
				/>
				{children}
			</div>
		)
	}

	private readonly _onBgMouseEvent = (e: React.MouseEvent) => {
		if (e.type === 'mousedown') {
			this.setState({
				backgroundClicked: true,
			})
		}
	}

	private readonly _onMouseWheel = (e: WheelEvent) => {
		// Turning off rounding so that two finger track pad scrolling will be smooth
		// TODO Detect if scroll amount is small or large, if large, round it
		if (this.props.requireCtrlToZoom === false || e.ctrlKey) {
			this._zoom(e.deltaY * scrollZoomMod, false)
		} else {
			this._pan(-e.deltaX, -e.deltaY)
		}
		e.preventDefault()
	}

	private readonly _onMouseMove = (e: MouseEvent) => {
		// if (e.ctrlKey) this._zoom(e.movementY * mouseZoomMod)
		if (e.buttons !== 1 && this.state.backgroundClicked) {
			this.setState({
				backgroundClicked: false,
			})
		}
		if (e.buttons === 4) this._pan(e.movementX, e.movementY)
		if (this.state.backgroundClicked && e.buttons === 1) {
			if (e.ctrlKey) {
				this._zoom(e.movementY * mouseZoomMod)
			} else {
				this._pan(e.movementX, e.movementY)
			}
		}
	}

	private readonly _zoom = (zoom: number, round: boolean = false) => {
		let newZoom = this._clampZoom(this.state.zoom - zoom)
		if (round) newZoom = Math.round(newZoom * 10) / 10

		const newPan = {
			x: this._clampPan(this.state.pan.x, newZoom),
			y: this._clampPan(this.state.pan.y, newZoom),
		}

		simpleGlobalClientState.zoom = newZoom
		simpleGlobalClientState.pan = newPan

		this.setState({
			zoom: newZoom,
			pan: {
				x: this._clampPan(this.state.pan.x, newZoom),
				y: this._clampPan(this.state.pan.y, newZoom),
			},
		})
	}

	private readonly _clampZoom = (val: number) =>
		Math.min(maxZoom, Math.max(minZoom, val))

	private readonly _pan = (x = 0, y = 0) => {
		const newPan = {
			x: this._clampPan(this.state.pan.x + (x * mousePanMod / this.state.zoom)),
			y: this._clampPan(this.state.pan.y + (y * mousePanMod / this.state.zoom)),
		}
		simpleGlobalClientState.pan = newPan
		this.setState({
			pan: newPan,
		})
	}

	private readonly _clampPan = (pan: number, zoom: number = this.state.zoom) =>
		Math.min(maxPan * zoom, Math.max(-maxPan * zoom, pan))
}

interface ZoomBgProps {
	onMouseEvent: (e: React.MouseEvent) => void
}

const ZoomBackground = React.memo(
	function _ZoomBackground({onMouseEvent}: ZoomBgProps) {
		return (
			// @ts-ignore disableIfShiftIsPressed
			<ContextMenuTrigger
				id={backgroundMenuId}
				disableIfShiftIsPressed={true}
				holdToDisplay={-1}
			>
				<div
					className={zoomBackgroundClass}
					style={{
						position: 'fixed',
						width: `${bgSize}vw`,
						height: `${bgSize}vh`,
						top: `-${bgSize / 2}vh`,
						left: `-${bgSize / 2}vw`,
						backgroundImage: `url(${PlusSVG})`,
					}}
					onMouseDown={onMouseEvent}
				/>
			</ContextMenuTrigger>
		)
	},
)

export const ConnectedZoom = shamuConnect(
	(state): IZoomReduxProps => ({
		requireCtrlToZoom: selectOptions(state).requireCtrlToScroll,
	}),
)(Zoom)
