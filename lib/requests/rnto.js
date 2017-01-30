'use strict'
/*
---
RNTO:
  rfc: 'https://tools.ietf.org/html/rfc959'
  help: RNTO <SP> file-name (rename (destination name))
  auth: true
  data: false
  responses:
    - 250 File renamed successfully
    - 550 Rename failed, file does not exist
    - 550 Rename failed
*/

const path = require('path')
const posix = path.posix

function RNTO (pathName) {
  if (!this.renameFrom) return this.respond(503, "Can't RNTO before RNFR")
  if (!this.listenerCount('rename')) {
    return this.respond(502, 'Command not implemented')
  }

  const localPathName = posix.resolve(this.cwd, pathName)
  pathName = path.join(this.root, localPathName)

  if (localPathName === '/') {
    return this.respond(550, "Can't rename home directory")
  }

  const renameFrom = path.join(this.root, this.renameFrom)

  return this.emitAsync('rename', renameFrom, pathName)
  .then(() => {
    this.renameFrom = null
    return this.respond(250, 'File renamed successfully')
  }, (err) => {
    return this.respond(550, 'Rename failed: %s', err.message)
  })
}

exports.auth = true
exports.write = true
exports.handler = RNTO
exports.help = 'RNTO <SP> file-name (rename (destination name))'
