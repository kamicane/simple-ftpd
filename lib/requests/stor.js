'use strict'
/*
---
STOR:
  rfc: 'https://tools.ietf.org/html/rfc959'
  help: STOR <SP> file-name (store a file)
  auth: true
  data: true
  responses:
    - 125 Data connection already open. Transfer starting
    - 150 File status okay. About to open data connection
    - 226 Transfer complete
    - 426 Transfer aborted via ABOR ?
    - 550 %s
    - 554 Invalid REST parameter
*/

const path = require('path')
const posix = path.posix
const sequence = require('async-sequence')
const pfy = require('../util/promisify')
const pump = pfy(require('pump'))

const STOR = sequence(function * STOR (socket, pathName) {
  if (!this.listenerCount('write')) {
    return this.respond(502, 'Command not implemented')
  }

  if (this.dataEncoding !== 'binary') {
    return this.respond(550, 'binary data encoding required for files')
  }

  const localPathName = posix.resolve(this.cwd, pathName)
  pathName = path.join(this.root, localPathName)

  const writable = yield this.emitAsync('write', pathName, this.dataOffset)
  yield this.respond(125, 'Data connection already open. Transfer starting')

  try {
    yield pump(socket, writable)
    this.dataOffset = 0 // reset data offset after write
    return this.respond(226, 'Transfer complete')
    // @todo handle aborted transfers for better log messages
    // this.respond(426, 'Transfer aborted')
  } catch (err) {
    return this.respond(550, err.message)
  }
})

exports.data = true
exports.auth = true
exports.write = true
exports.handler = STOR
exports.help = 'STOR <SP> file-name (store a file)'
