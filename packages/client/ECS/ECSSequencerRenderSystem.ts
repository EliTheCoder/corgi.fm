import {List, Map, Set} from 'immutable'
import {CssColor} from '@corgifm/common/shamu-color'
import {ECSCanvasRenderSystem} from './ECSCanvasRenderSystem'
import {ECSComponentType, ECSEntity, ECSSystem} from './ECSTypes'

export class ECSSequencerRenderSystem extends ECSSystem {
	public static readonly canvasIdPrefix = 'ECSCanvasRenderSystemCanvas-node-'

	private _canvasContexts = Map<Id, CanvasRenderingContext2D>()
	private _isPlaying = Map<Id, boolean>()

	public getRequiredComponents(): Set<ECSComponentType> {
		return Set([
			ECSComponentType.NodeRenderer,
			ECSComponentType.GraphPosition,
		])
	}

	public onSetActiveRoom = () => {
		this._canvasContexts = this._canvasContexts.clear()
	}

	public execute(entities: List<ECSEntity>): void {
		entities.forEach(this.processEntity)
	}

	private readonly processEntity = (entity: ECSEntity) => {
		const nodeId = entity.getGraphPositionComponent()!.id

		const canvasContext = this._getContextForNodeId(nodeId)

		if (!canvasContext) return

		const sequencerComp = entity.getSequencerComponent()!

		if (sequencerComp.isPlaying !== this._isPlaying.get(nodeId, undefined)) {
			this._isPlaying = this._isPlaying.set(nodeId, sequencerComp.isPlaying)

			if (sequencerComp.isPlaying === false) {
				canvasContext.clearRect(0, 0, ECSCanvasRenderSystem.canvasSize, ECSCanvasRenderSystem.canvasSize)
				return
			}
		}

		if (sequencerComp.isPlaying === false) return

		canvasContext.clearRect(0, 0, ECSCanvasRenderSystem.canvasSize, ECSCanvasRenderSystem.canvasSize)

		const graphPosition = entity.getGraphPositionComponent()!

		const x = sequencerComp.notesDisplayStartX + (sequencerComp.notesDisplayWidth * sequencerComp.ratio) - 1

		if (x >= sequencerComp.notesDisplayStartX) {
			canvasContext.fillStyle = CssColor.defaultGray
		} else {
			canvasContext.fillStyle = '#0000'
		}

		canvasContext.fillRect(
			x,
			0,
			1,
			graphPosition.height,
		)
	}

	private _getContextForNodeId(nodeId: Id) {
		const canvasContext = this._canvasContexts.get(nodeId)

		if (canvasContext) return canvasContext

		const canvasElement = document.getElementById(ECSSequencerRenderSystem.canvasIdPrefix + nodeId) as HTMLCanvasElement

		if (canvasElement) {
			const context = canvasElement.getContext('2d')!
			this._canvasContexts = this._canvasContexts.set(nodeId, context)
			return context
		}

		return null
	}
}
