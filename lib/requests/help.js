'use strict'
/*
---
HELP:
  rfc: 'https://tools.ietf.org/html/rfc959'
  help: 'HELP [<SP> cmd] (show help)'
  auth: false
  data: false
  responses:
    - 214 %s
    - 501 Unrecognized command
    - |
      214-The following commands are recognized:
      %s
      214 Help command successful
*/

const pfy = require('../util/promisify')

function HELP (command) {
  const names = Object.getOwnPropertyNames(this.requests)

  if (command) {
    if (names.includes(command)) {
      const cmd = this.requests[command]
      if (cmd.help) this.respond(214, 'Syntax: %s', cmd.help)
      else this.respond(501, 'No help for %s', command)
    } else {
      this.respond(501, 'Unrecognized command %s', command)
    }
  } else {
    const helps = []

    for (let name in names) {
      const cmd = this.requests[name]
      if (cmd.help) helps.push(`Syntax: ${cmd.help}`)
    }

    const message = [
      '214- The following commands are recognized',
      ...helps,
      '214 End'
    ].join('\r\n')
    this.log(message)

    const telnet = this.telnet
    return pfy(telnet.write).call(telnet, `${message}.\r\n`)
  }
}

exports.handler = HELP
exports.help = 'HELP [<SP> cmd] (show help)'
