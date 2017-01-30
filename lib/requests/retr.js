'use strict'
/*
---
RETR:
  rfc: 'https://tools.ietf.org/html/rfc959'
  help: RETR <SP> file-name (retrieve a file)
  auth: true
  data: true
  responses:
    - 125 Data connection already open. Transfer starting
    - 150 File status okay. About to open data connection
    - 226 Transfer complete
    - 426 Transfer aborted via ABOR
    - 426 Transfer aborted; %d bytes transmitted
    - 550 %s
    - 554 Invalid REST parameter
*/

const path = require('path')
const posix = path.posix
const sequence = require('async-sequence')
const pfy = require('../util/promisify')
const pump = pfy(require('pump'))

const RETR = sequence(function * RETR (socket, pathName) {
  if (!this.listenerCount('read')) {
    return this.respond(502, 'Command not implemented')
  }

  if (this.dataEncoding !== 'binary') {
    return this.respond(550, 'binary data encoding required for files')
  }

  const localPathName = posix.resolve(this.cwd, pathName)
  pathName = path.join(this.root, localPathName)

  const readable = yield this.emitAsync('read', pathName, this.dataOffset)
  yield this.respond(125, 'Data connection already open. Transfer starting')

  try {
    yield pump(readable, socket)
    this.dataOffset = 0 // reset data offset after write
    return this.respond(226, 'Transfer complete')
    // @todo handle aborted transfers for better log messages
    // this.respond(426, 'Transfer aborted')
  } catch (err) {
    return this.respond(550, err.message)
  }
})

exports.auth = true
exports.data = true
exports.handler = RETR
exports.help = 'RETR <SP> file-name (retrieve a file)'

