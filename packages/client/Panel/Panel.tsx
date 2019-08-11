import React from 'react'
import {useDispatch} from 'react-redux'
import {ConnectionNodeType} from '@corgifm/common/common-types'
import {
	AppOptions, getConnectionNodeInfo, MASTER_AUDIO_OUTPUT_TARGET_ID,
	positionActions, selectOption, selectPosition, setOption, shamuConnect,
} from '@corgifm/common/redux'
import {CssColor} from '@corgifm/common/shamu-color'
import {handleClassName, handleVisualClassName} from '../client-constants'
import './Panel.less'

export interface IPanelProps {
	children: any
	className?: string
	color?: string
	id?: Id
	label?: string
	labelTitle?: string
	saturate?: boolean
	autoSize?: boolean
	helpText?: string
	ownerName?: string
	extra?: string
}

interface ReduxProps {
	enabled: boolean
	nodeType: ConnectionNodeType
}

type AllProps = IPanelProps & ReduxProps

export const DumbPanel: React.FC<AllProps> =
	React.memo(function _Panel({
		autoSize = false, children, className = '', color = CssColor.disabledGray, nodeType,
		id, label, labelTitle, saturate = false, helpText, ownerName, enabled, extra,
	}) {
		const dispatch = useDispatch()

		const renderLabel = label !== undefined && label !== ''

		const nodeInfo = getConnectionNodeInfo(nodeType)

		return (
			<div
				style={{
					color: enabled ? color : CssColor.disabledGray,
					position: 'relative',
					width: autoSize ? 'auto' : undefined,
					height: autoSize ? 'auto' : undefined,
				}}
				className={`panelContainer ${handleClassName} ${saturate ? 'saturate' : ''}`}
			>
				{renderLabel &&
					<div
						className={`header ${handleClassName} ${handleVisualClassName}`}
						title={labelTitle}
					>
						<div
							className={`colorDotContainer noDrag ${enabled ? 'enabled' : ''}`}
							onClick={onColorDotClick}
							title={(enabled ? 'Enabled' : 'Disabled') +
								`\nDisable or enable this node\n` +
								nodeInfo.disabledText + ' when disabled'}
						>
							<div className="colorDot" />
						</div>
						<div className="label">{label}</div>
						{ownerName &&
							<div
								className="ownerName"
								title={`This node belongs to ${ownerName}`}
							>
								{ownerName}
							</div>
						}
						{extra &&
							<div className="extra" title={extra}>{extra}</div>
						}
						{helpText &&
							<div className="helpText" title={helpText}>?</div>
						}
					</div>
				}
				<div
					id={id as string}
					className={`panel ${className}`}
				>
					{children}
				</div>
			</div>
		)

		function onColorDotClick() {
			if (id === undefined) return

			if (id === MASTER_AUDIO_OUTPUT_TARGET_ID) {
				dispatch(setOption(AppOptions.masterVolumeMute, enabled))
			} else {
				dispatch(positionActions.setEnabled(id, !enabled))
			}
		}
	})

export const Panel = shamuConnect(
	(state, {id}: IPanelProps): ReduxProps => {
		const position = selectPosition(state.room, id === undefined ? '' : id)
		return {
			enabled: position.targetType === ConnectionNodeType.audioOutput
				? (selectOption(state, AppOptions.masterVolumeMute) as boolean) === false
				: position.enabled,
			nodeType: position.targetType,
		}
	},
)(DumbPanel)
