'use strict'
/*
---
PASV:
  rfc: 'https://tools.ietf.org/html/rfc959'
  help: PASV (open passive data connection)
  auth: true
  data: false
  responses:
    - 227 Entering passive mode (%s,%d,%d)
    - 425 Too many connections. Can't open data channel
    - 425 Rejected data connection from foreign address %s:%s
    - 421 Passive data channel timed out
    - 503 PASV not allowed after EPSV ALL
*/

const pfy = require('../util/promisify')
const sequence = require('async-sequence')

// @todo: proper errors, check ports, check host, etc.
// @todo: limit dataServer to 1 connection ?
const PASV = sequence(function * PASV (dataServer) {
  // ensure the dataServer is listening
  if (!dataServer.listening) {
    try {
      // listen to a os assigned port
      yield pfy(dataServer.listen).call(dataServer, 0, this.host)
    } catch (err) {
      return this.respond(425, err.message)
    }
  }

  // get the assigned port
  const port = dataServer.address().port
  const p1 = port / 256 | 0
  const p2 = port % 256

  // tell the client we're listening
  yield this.respond(
    227, 'Entering passive mode (%s,%d,%d)',
    this.host.split('.').join(','), p1, p2
  )

  // return a (promised) socket
  return pfy(dataServer.once, true).call(dataServer, 'connection')
})

exports.auth = true
exports.handler = PASV
exports.help = 'PASV (open passive data connection)'
