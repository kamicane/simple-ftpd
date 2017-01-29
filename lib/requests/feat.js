'use strict'
/*
---
FEAT:
  rfc: 'https://tools.ietf.org/html/rfc2389'
  help: FEAT (list all new features supported)
  auth: false
  data: false
    responses:
      ok: |
      211-Features supported:
      %s
      211 End FEAT
*/

const pfy = require('../util/promisify')

function FEAT () {
  const requests = this.requests
  const feats = []

  for (let name in requests) {
    const request = requests[name]
    if (request.feat) feats.push(` ${request.feat}`)
  }

  const message = [
    '211- Features supported',
    ...feats,
    // ' MDTM',
    // ' MLST Type*;Size*;Modify*;Perm;Unique*;',
    // ' REST STREAM',
    // ' SIZE',
    // ' TVFS',
    '211 End'
  ].join('\r\n')
  this.log(message)
  const telnet = this.telnet
  return pfy(telnet.write).call(telnet, `${message}.\r\n`)
}

exports.handler = FEAT
exports.help = 'FEAT (list all new features supported)'
