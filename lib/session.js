'use strict'

const EventEmitter = require('events')
const net = require('net')
const sprintf = require('sprintf')
const requests = require('./requests')

const chalk = require('chalk')
const pfy = require('./util/promisify')

// const SOCKET_EVENTS = [
//   'close', 'connect', 'data', 'drain', 'end', 'error', 'lookup', 'timeout'
// ]

// const SERVER_EVENTS = [
//   'close', 'connection', 'error', 'listening'
// ]

class Session extends EventEmitter {

  constructor (telnet, opts) {
    super()

    opts = Object.assign({
      host: telnet.localAddress,
      root: '/',
      readOnly: true
    }, opts)

    console.log(opts.readOnly)

    const host = this.host = opts.host

    if (!net.isIPv4(host)) throw new Error(`invalid hostname ${host}`)

    this.cwd = '/' // current working directory
    this.root = opts.root // server root, invisible to client
    this.readOnly = opts.readOnly

    this.dataEncoding = 'binary'
    this.dataOffset = 0

    this.requests = requests

    // DEBUG
    // SOCKET_EVENTS.forEach((event) => {
    //   if (event === 'data') return
    //   telnet.on(event, (...args) => {
    //     console.error(`## TELNET ${event}:`, ...args)
    //   })
    // })

    telnet.setEncoding('utf8')

    this.telnet = telnet
  }

  emitAsync (...args) {
    return pfy(this.emit).call(this, ...args)
  }

  accept (message) {
    const telnet = this.telnet

    const dataServer = this.dataServer = net.createServer()
    // ftp passive server should only support 1 connection at a time (?)
    // dataServer.maxConnections = 1

    // DEBUG
    // SERVER_EVENTS.forEach((event) => {
    //   if (event === 'connection') return
    //   dataServer.on(event, (...args) => {
    //     console.error(`## PASV ${event}:`, ...args)
    //   })
    // })

    telnet.on('data', (string) => {
      this.parseMessage(string)
    })

    telnet.once('close', () => {
      dataServer.close(() => {
        this.emit('close')
      })
    })

    return this.respond(220, message || 'Service ready for new user')
  }

  reject (message, ...params) {
    return this.respond(421, message, ...params)
    .then(() => {
      this.telnet.end()
      this.emit('close')
    })
  }

  log (...messages) {
    console.log(...messages)
  }

  processRequest (command, ...params) {
    this.log(`> ${chalk.red(command)} ${chalk.magenta(params.join(', '))}`)
    const names = Object.getOwnPropertyNames(this.requests)

    if (!names.includes(command)) { // an added protection to avoid shenanigans
      return this.respond(502, 'Command not supported')
    }

    const cmd = this.requests[command]

    if (cmd.auth && !this.authenticated) {
      return this.respond(530, 'Log in with USER and PASS first')
    }

    if (cmd.write && this.readOnly) {
      return this.respond(532, 'You can only read')
    }

    const handler = cmd.handler

    let request
    const dataServer = this.dataServer

    if (cmd.data) {
      let dataSocket
      request = this.promisedSocket
      .then((socket) => {
        return handler.call(this, (dataSocket = socket), ...params)
      })
      .then(() => {
        // clean shit up after each connection
        // this is how FTP wants things done (I think)
        dataSocket.end()
        return pfy(dataServer.close).call(dataServer)
      })
    } else if (command === 'PASV') {
      request = this.promisedSocket = handler.call(this, dataServer)
    } else {
      request = handler.call(this, ...params)
    }

    return request.catch((err) => {
      return this.respond(500, err.message)
    })
  }

  parseMessage (message) {
    message = message.replace(/\s+/g, ' ').trim()
    const params = message.split(' ')
    const command = params.shift().toUpperCase()
    return this.processRequest(command, params.join(' '))
  }

  respond (code, message, ...params) {
    let formatted = message
    if (params.length) formatted = sprintf(message, ...params)

    let color, type

    if (code < 400) {
      color = chalk.green
      type = 'OK'
    } else if (code >= 400 && code < 500) {
      type = 'WARN'
      color = chalk.yellow
    } else if (code >= 500 && code < 600) {
      type = 'ERR'
      color = chalk.red
    } else {
      type = 'INFO'
      color = chalk.cyan
    }

    const telnet = this.telnet
    return pfy(telnet.write).call(telnet, `${code} ${formatted}.\r\n`)
    .then(() => {
      this.log(`${color(type)}: ${color(code)} ${chalk.grey(formatted)}`)
    })
  }

}

module.exports = Session
