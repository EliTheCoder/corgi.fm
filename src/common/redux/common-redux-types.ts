import {IAudioState} from './audio-redux'
import {IBasicInstrumentsState} from './basic-instruments-redux'
import {IBasicSamplersState} from './basic-sampler-redux'
import {IChatState} from './chat-redux'
import {IClientsState} from './clients-redux'
import {IConnectionsState} from './connections-redux'
import {IGlobalClockState} from './global-clock-redux'
import {IGridSequencersState} from './grid-sequencers-redux'
import {IInfiniteSequencersState} from './infinite-sequencers-redux'
import {IOptionsState} from './options-redux'
import {IPositionsState} from './positions-redux'
import {IRoomMembersState} from './room-members-redux'
import {IRoomsState} from './rooms-redux'
import {IVirtualKeyboardsState} from './virtual-keyboard-redux'
import {IWebsocketState} from './websocket-redux'

export interface IClientAppState {
	audio: IAudioState
	clients: IClientsState
	options: IOptionsState
	rooms: IRoomsState
	websocket: IWebsocketState
	room: IClientRoomState
}

export interface IClientRoomState {
	basicInstruments: IBasicInstrumentsState
	basicSamplers: IBasicSamplersState
	chat: IChatState
	connections: IConnectionsState
	globalClock: IGlobalClockState
	gridSequencers: IGridSequencersState
	infiniteSequencers: IInfiniteSequencersState
	members: IRoomMembersState
	positions: IPositionsState
	virtualKeyboards: IVirtualKeyboardsState
}
