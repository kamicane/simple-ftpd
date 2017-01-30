'use strict'
/*
---
DELE:
  rfc: 'https://tools.ietf.org/html/rfc959'
  help: DELE <SP> file-name (delete file)
  auth: true
  data: false
  responses:
    - 250 File removed
    - 550 %s
*/

const path = require('path')
const posix = path.posix

function DELE (pathName) {
  if (!this.listenerCount('unlink')) {
    return this.respond(502, 'Command not implemented')
  }

  const localPathName = posix.resolve(this.cwd, pathName)
  pathName = path.join(this.root, localPathName)

  return this.emitAsync('unlink', pathName)
  .then(() => {
    return this.respond(250, 'File %s removed', localPathName)
  }, (err) => {
    return this.respond(550, err.message)
  })
}

exports.auth = true
exports.write = true
exports.handler = DELE
exports.help = 'DELE <SP> file-name (delete file)'
