'use strict'
/*
---
SYST:
  rfc: 'https://tools.ietf.org/html/rfc959'
  help: SYST (get operating system type)
  auth: false
  data: false
  responses:
    - '215 UNIX Type: L8'
*/

function SYST () {
  return this.respond(215, 'UNIX Type: L8')
}

exports.handler = SYST
exports.help = 'SYST (get operating system type)'
