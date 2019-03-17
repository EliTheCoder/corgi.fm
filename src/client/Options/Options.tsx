import * as React from 'react'
import {Fragment} from 'react'
import {AppOptions} from '../../common/redux'
import {Button} from '../Button/Button'
import {ConnectedOption} from '../Option'
import {ShamuBorder} from '../Panel/Panel'
import './Options.less'

export class Options extends React.Component {
	public state = {
		showOptions: false,
	}

	public componentDidMount() {
		window.addEventListener('keydown', this._onKeyDown)
	}

	public componentWillUnmount() {
		window.removeEventListener('keydown', this._onKeyDown)
	}

	public render() {
		return (
			<Fragment>
				<Button
					buttonProps={{onClick: () => this.setState({showOptions: !this.state.showOptions})}}
				>
					Options
				</Button>
				{this.state.showOptions &&
					<div className="optionsBG" onClick={() => this._hideOptions()}>
						<div className="optionsPanel" onClick={e => e.stopPropagation()}>
							<div className="optionsPanelInner" >
								<ConnectedOption
									option={AppOptions.showNoteNamesOnKeyboard}
									label="show names on keyboard"
								/>
								<ConnectedOption
									option={AppOptions.requireCtrlToScroll}
									label="require control key to zoom"
								/>
								<ConnectedOption
									option={AppOptions.showNoteSchedulerDebug}
									label="show synth note scheduler debug under synth"
								/>
								<ConnectedOption
									option={AppOptions.renderNoteSchedulerDebugWhileStopped}
									label="keep rendering note scheduler debug even when song is stopped"
								/>
								<ConnectedOption
									option={AppOptions.enableEfficientMode}
									label="enable efficient mode to improve performance, but lower visual quality"
								/>
							</div>
							<ShamuBorder saturate={false} />
						</div>
					</div>
				}
			</Fragment>
		)
	}

	private readonly _onKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Escape' && this.state.showOptions) {
			this._hideOptions()
		}
	}

	private readonly _hideOptions = () => this.setState({showOptions: false})
}
