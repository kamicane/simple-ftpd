'use strict'
/*
---
CWD:
  rfc: 'https://tools.ietf.org/html/rfc697'
  help: CWD [<SP> dir-name] (change working directory)
  auth: true
  data: false
  responses:
    - 250 "%s" is the current directory
    - 550 %s
*/

const path = require('path')
const posix = path.posix
const mode = require('stat-mode')

function CWD (pathName) {
  const localPathName = posix.resolve(this.cwd, pathName)
  pathName = path.join(this.root, localPathName)

  return this.emitAsync('stat', pathName)
  .then((stat) => {
    if (!mode(stat).isDirectory()) {
      return this.respond(550, '%s is Not a directory', localPathName)
    } else {
      this.cwd = localPathName
      return this.respond(250, '"%s" is the current directory', localPathName)
    }
  }, (err) => {
    this.respond(550, err.message)
  })
}

exports.auth = true
exports.handler = CWD
exports.help = 'CWD [<SP> dir-name] (change working directory)'
