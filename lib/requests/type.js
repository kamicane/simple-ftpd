'use strict'
/*
---
TYPE:
  rfc: 'https://tools.ietf.org/html/rfc959'
  help: TYPE <SP> [A | I] (set transfer type)
  auth: true
  data: false
  responses:
    - 200 Type set to %s
    - 504 Unsupported type "%s"
*/

// @todo ?: this is only used for checking for now.
// file transfers need to be binary
// list transfers are always utf8
function TYPE (type) {
  const okMsg = 'Transfer type set to %s'

  switch (type) {
    case 'A':
      this.dataEncoding = 'utf8'
      return this.respond(200, okMsg, this.dataEncoding)
    case 'I':
      this.dataEncoding = 'binary'
      return this.respond(200, okMsg, this.dataEncoding)
    case 'L':
      this.dataEncoding = 'binary'
      return this.respond(200, okMsg, this.dataEncoding)
    default:
      return this.respond(504, 'Unsupported type "%s"', type)
  }
}

exports.auth = true
exports.handler = TYPE
exports.help = 'TYPE <SP> [A | I] (set transfer type)'
