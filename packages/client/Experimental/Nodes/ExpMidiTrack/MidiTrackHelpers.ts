import {mouseFromScreenToBoard, makeMouseMovementAccountForGlobalZoom} from '../../../SimpleGlobalClientState'
import {controlsWidth, offsetY, minimapHeight} from './MidiTrackConstants'

export function getMaxPan(length: number, zoom: number) {
	return (length * zoom) - length
}

export function clientSpaceToPercentages(
	clientSpace: Point, nodePosition: Point, panPixels: Point, maxPanX: number,
	maxPanY: number, width: number, height: number,
) {
	const editorSpace = clientSpaceToEditorSpace(clientSpace, nodePosition)

	return editorSpaceToPercentages(
		editorSpace, panPixels, maxPanX, maxPanY, width, height)
}

export function editorSpaceToPercentages(
	editorSpace: Point, panPixels: Point, maxPanX: number, maxPanY: number,
	width: number, height: number,
): Point {
	const panSpace = {
		x: (editorSpace.x + panPixels.x) / (width),
		y: (editorSpace.y + panPixels.y) / (height),
		centerY: (height / 2 + panPixels.y) / (height),
	}

	return panSpace
}

export function editorOffsetSpaceToPercentages(
	editorOffsetSpace: Point, scaledWidth: number, scaledHeight: number,
): Point {
	const panSpace = {
		x: editorOffsetSpace.x / scaledWidth,
		y: editorOffsetSpace.y / scaledHeight,
	}

	return panSpace
}

export function clientSpaceToEditorSpace(
	clientSpace: Point, nodePosition: Point,
) {

	const boardSpace = mouseFromScreenToBoard(clientSpace)

	const nodeSpace = {
		x: boardSpace.x - nodePosition.x,
		y: boardSpace.y - nodePosition.y,
	}

	const editorSpace = {
		x: nodeSpace.x - controlsWidth,
		y: nodeSpace.y - offsetY - minimapHeight,
	}

	return editorSpace
}

export function movementXToBeats(movementX: number, pixelsPerBeat: number) {
	const a = makeMouseMovementAccountForGlobalZoom({x: movementX, y: 0}).x

	return a / pixelsPerBeat
}

export function movementYToNote(movementY: number, rows: string[], zoomY: number, height: number) {
	const a = makeMouseMovementAccountForGlobalZoom({x: 0, y: movementY}).y

	const scaledHeight = zoomY * height

	const percentageMovement = a / scaledHeight

	return percentageMovement * rows.length
}

export interface TimeSelect {
	start: number
	duration: number
}
