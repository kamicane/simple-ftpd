'use strict'
/*
---
MKD:
  rfc: 'https://tools.ietf.org/html/rfc959'
  help: MKD <SP> path (create directory)
  auth: true
  data: false
  responses:
    - 257 "%s" directory created
    - 550 %s
*/

const path = require('path')
const posix = path.posix

function MKD (pathName) {
  if (!this.listenerCount('mkdir')) {
    return this.respond(502, 'Command not implemented')
  }

  const localPathName = posix.resolve(this.cwd, pathName)
  pathName = path.join(this.root, localPathName)

  return this.emitAsync('mkdir', pathName)
  .then(() => {
    // The 257 response is supposed to include the directory
    // name and in case it contains embedded double-quotes
    // they must be doubled (see RFC-959, chapter 7, appendix 2).
    return this.respond(
      257, '"%s" Directory created',
      localPathName.replace('"', '""')
    )
  }, (err) => {
    return this.respond(550, err.message)
  })
}

exports.auth = true
exports.write = true
exports.handler = MKD
exports.help = 'MKD <SP> path (create directory)'
