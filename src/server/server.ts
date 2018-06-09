import * as animal from 'animal-id'
import * as express from 'express'
import * as http from 'http'
import * as path from 'path'
import * as socketIO from 'socket.io'
import {Clients} from './Clients'
import {logger} from './logger'

const app = express()
const server = new http.Server(app)
const io = socketIO(server)

app.get('/', (_, res) => {
	res.sendFile(path.join(__dirname, '../client/index.html'))
})

app.use(express.static(path.join(__dirname, '../client')))

const clients = new Clients()

io.on('connection', socket => {
	logger.log('new connection | ', socket.id)

	clients.add(socket.id)

	sendClientsToNewClient(socket)
	sendNewClient(socket.id)

	socket.on('notes', notespayload => {
		logger.log(`client: ${socket.id} | `, notespayload)
		socket.broadcast.emit('notes', {
			notes: notespayload.notes,
			clientId: socket.id,
		})
	})

	socket.on('disconnect', () => {
		logger.log(`client disconnected: ${socket.id}`)
		clients.remove(socket.id)
		sendClientDisconnected(socket.id)
	})
})

let nextId = 1

const engine: any = io.engine

engine.generateId = () => {
	return animal.getId() + '-' + nextId++
}

// function sendClients() {
// 	logger.debug('sending clients info to all clients')
// 	io.local.emit('clients', {
// 		clients: clients.toArray(),
// 	})
// }

function sendClientsToNewClient(newClientSocket) {
	logger.debug('sending clients info to new client')
	newClientSocket.emit('clients', {
		clients: clients.toArray(),
	})
}

function sendNewClient(id) {
	logger.debug('sending new client info to all clients')
	io.local.emit('newClient', {
		id,
	})
}

function sendClientDisconnected(id) {
	logger.debug('sending clientDisconnected to all clients')
	io.local.emit('clientDisconnected', {
		id,
	})
}

const port = 80

server.listen(port)

logger.log('listening on port', port)