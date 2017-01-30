'use strict'
/*
---
RNFR:
  rfc: 'https://tools.ietf.org/html/rfc959'
  help: RNFR <SP> file-name (rename (source name))
  auth: true
  data: false
  responses:
    - 550 No such file or directory
    - 550 Can't rename home directory
    - 350 Ready for destination name
*/

const path = require('path')
const posix = path.posix

function RNFR (pathName) {
  if (!this.listenerCount('rename')) {
    return this.respond(502, 'Command not implemented')
  }

  const localPathName = posix.resolve(this.cwd, pathName)
  pathName = path.join(this.root, localPathName)

  if (localPathName === '/') {
    return this.respond(550, "Can't rename home directory")
  }

  return this.emitAsync('stat', pathName)
  .then(() => {
    this.renameFrom = localPathName
    return this.respond(350, 'Ready for destination name')
  }, (err) => {
    return this.respond(550, err.message)
  })
}

exports.auth = true
exports.write = true
exports.handler = RNFR
exports.help = 'RNFR <SP> file-name (rename (source name))'
