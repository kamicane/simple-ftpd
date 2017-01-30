'use strict'
/*
---
RMD:
  rfc: 'https://tools.ietf.org/html/rfc959'
  help: RMD <SP> dir-name (remove directory)
  auth: true
  data: false
  responses:
    - 250 Directory removed
    - 550 ?
    - 550 Can't remove root directory
*/

const path = require('path')
const posix = path.posix

// @todo ?: should this recursively emit rmdir / unlink events
//          for each file in the directory ?
//          for now, emit a "remove" event
function RMD (pathName) {
  if (!this.listenerCount('remove')) {
    return this.respond(502, 'Command not implemented')
  }

  const localPathName = posix.resolve(this.cwd, pathName)
  pathName = path.join(this.root, localPathName)

  if (localPathName === '/') {
    return this.respond(550, "Can't remove root directory")
  }

  return this.emitAsync('remove', pathName)
  .then(() => {
    return this.respond(250, 'Directory %s removed', localPathName)
  }, (err) => {
    return this.respond(550, err.message)
  })
}

exports.auth = true
exports.write = true
exports.handler = RMD
exports.help = 'RMD <SP> dir-name (remove directory)'
