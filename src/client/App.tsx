import * as React from 'react'
import {hot} from 'react-hot-loader'
import {connect} from 'react-redux'
import {selectIsLocalClientReady} from '../common/redux'
import {IClientAppState} from '../common/redux'
import './App.less'
import './css-reset.css'
import {isLocalDevClient} from './is-prod-client'
import {ConnectedOnlineApp} from './OnlineApp'
import {Options} from './Options/Options'
import {SimpleReverbView} from './ShamuNodes/SimpleReverb/SimpleReverbView'

interface IAppProps {
	isLocalClientReady: boolean
}

class App extends React.Component<IAppProps, {}> {
	public render() {
		const {isLocalClientReady} = this.props

		if (isLocalDevClient()) {
			switch (window.location.pathname.replace('/', '')) {
				case 'options': return <Options />
				case 'reverb': return <SimpleReverbView id="-1" color="red" isPlaying={false} />
				// case 'infiniteSequencer': return <InfiniteSequencer id="fakeId" />
			}
		}

		if (isLocalClientReady) {
			return <ConnectedOnlineApp />
		} else {
			return <div
				style={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100%',
					fontSize: '2em',
				}}
			>
				Connecting...
			</div>
		}
	}
}

const mapStateToProps = (state: IClientAppState) => ({
	isLocalClientReady: selectIsLocalClientReady(state),
})

export const ConnectedApp = hot(module)(connect(mapStateToProps)(App))
