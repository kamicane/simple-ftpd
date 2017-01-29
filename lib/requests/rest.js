'use strict'
/*
---
REST:
  rfc: 'https://tools.ietf.org/html/rfc3659'
  help: REST <SP> offset (set file offset)
  auth: true
  data: false
  responses:
    - 501 Resuming transfers not allowed in ASCII mode
    - 501 Invalid parameter
    - 350 Transfer offset set at position %d
*/

function REST (offset) {
  offset = parseInt(offset, 0)
  if (isNaN(offset)) return this.respond(501, 'Invalid parameter')

  this.dataOffset = offset
  return this.respond(350, 'Transfer offset set at position %d', offset)
}

exports.auth = true
exports.handler = REST
exports.feat = 'REST STREAM'
exports.help = 'REST <SP> offset (set file offset)'
