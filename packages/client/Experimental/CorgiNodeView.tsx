import React from 'react'
import {hot} from 'react-hot-loader'
import {ExpConnectorPlaceholders} from '../Connections/ExpConnectorPlaceholders'
import {SimpleGraphNodeExp} from '../SimpleGraph/SimpleGraphNodeExp'
import {ExpNodeDebugView} from './ExpNodeDebugView'
import {ExpNodeMaxView} from './ExpNodeMaxView'
import {ExpPorts} from './ExpPorts'
import {ExpNodeContext, CorgiNodeReact} from './CorgiNode'
import {
	ExpAudioParams, ExpCustomNumberParams, ExpCustomEnumParams,
	ExpCustomStringParams, ExpButtons, ExpReferenceParams,
} from './ExpParams'
import './ExpNodes.less'

interface Props {
	readonly beforeChildren: React.ReactNode
	readonly children: React.ReactNode
	readonly context: CorgiNodeReact
	readonly audioParams: ExpAudioParams
	readonly customNumberParams: ExpCustomNumberParams
	readonly customEnumParams: ExpCustomEnumParams
	readonly customStringParams: ExpCustomStringParams
	readonly referenceParams: ExpReferenceParams
	readonly buttons: ExpButtons
	readonly ports: ExpPorts
}

const viewMode = 'debug' as 'max' | 'debug'

export const CorgiNodeView = hot(module)(React.memo(function _CorgiNodeView({
	beforeChildren, children, context, audioParams, customNumberParams, ports, customEnumParams,
	customStringParams, referenceParams, buttons,
}: Props) {
	return (
		<ExpNodeContext.Provider value={context}>
			<ExpConnectorPlaceholders />
			<SimpleGraphNodeExp>
				{viewMode === 'debug' &&
					<ExpNodeDebugView
						audioParams={audioParams}
						customNumberParams={customNumberParams}
						customEnumParams={customEnumParams}
						customStringParams={customStringParams}
						referenceParams={referenceParams}
						ports={ports}
						beforeChildren={beforeChildren}
						buttons={buttons}
					>
						{children}
					</ExpNodeDebugView>
				}
				{viewMode === 'max' &&
					<ExpNodeMaxView
						audioParams={audioParams}
						customNumberParams={customNumberParams}
						customEnumParams={customEnumParams}
						customStringParams={customStringParams}
						ports={ports}
					>
						{children}
					</ExpNodeMaxView>
				}
			</SimpleGraphNodeExp>
		</ExpNodeContext.Provider>
	)
}))
