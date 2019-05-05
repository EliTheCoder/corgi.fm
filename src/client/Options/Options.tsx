import * as React from 'react'
import {Fragment} from 'react'
import {AppOptions, LineType, roomSettingsActions, selectRoomSettings} from '../../common/redux'
import {Button} from '../Button/Button'
import {Modal} from '../Modal/Modal'
import {ConnectedOption} from '../Option'
import {ConnectedOptionCheckbox} from '../RoomSetting'
import './Options.less'

export const Options = React.memo(function _Options() {
	const [visible, setVisible] = React.useState(false)

	return (
		<Fragment>
			<Button
				buttonProps={{onClick: () => setVisible(!visible)}}
			>
				Options
			</Button>
			{visible &&
				<Modal
					onHide={() => setVisible(false)}
					className="options"
				>
					<div className="modalSection localOptions">
						<div className="modalSectionLabel">Local Options</div>
						<div className="modalSectionSubLabel">won't affect anyone else</div>
						<ConnectedOption
							option={AppOptions.showNoteNamesOnKeyboard}
							label="show note names on keyboard"
						/>
						<ConnectedOption
							option={AppOptions.requireCtrlToScroll}
							label="require control key to zoom (might be needed by laptop users)"
						/>
						<ConnectedOption
							option={AppOptions.showNoteSchedulerDebug}
							label="note scheduler debug: enable"
						/>
						<ConnectedOption
							option={AppOptions.renderNoteSchedulerDebugWhileStopped}
							label="note scheduler debug: keep rendering even when song is stopped"
						/>
						<ConnectedOption
							option={AppOptions.graphics_fancyConnections}
							label="graphics: enable fancy connections"
						/>
						<ConnectedOption
							option={AppOptions.graphics_ECS}
							label="graphics: enable ECS animations (sequencer time marker thing)"
						/>
						<ConnectedOption
							option={AppOptions.graphics_expensiveZoomPan}
							label="graphics: enable expensive/fancy zoom and pan (sharper render, but slower)"
						/>
					</div>
					<div className="modalSection roomOptions">
						<div className="modalSectionLabel">Room Options</div>
						<div className="modalSectionSubLabel">other people in this room will see these changes</div>
						<ConnectedOptionCheckbox
							label="straight connection lines"
							onChange={dispatch => e =>
								dispatch(roomSettingsActions.changeLineType(e.target.checked
									? LineType.Straight
									: LineType.Curved,
								))}
							valueSelector={state =>
								selectRoomSettings(state.room).lineType === LineType.Straight
									? true
									: false
							}
						/>
					</div>
				</Modal>
			}
		</Fragment>
	)
})
