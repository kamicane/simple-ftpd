'use strict'
/*
---
USER:
  rfc: 'https://tools.ietf.org/html/rfc959'
  help: USER <SP> user-name (set username)
  auth: false
  data: false
  responses:
    - 331 Username ok, send password
    - 331 Previous account information was flushed, send password
*/

function USER (username) {
  this.username = username
  return this.respond(331, 'User %s ok, send password', username)
}

exports.handler = USER
exports.help = 'USER <SP> user-name (set username)'
