'use strict'
/*
---
PWD:
  rfc: 'https://tools.ietf.org/html/rfc959'
  help: PWD (get current working directory)
  auth: true
  data: false
  responses:
    - 257 "%s" is the current directory
*/

function PWD () {
  // The 257 response is supposed to include the directory
  // name and in case it contains embedded double-quotes
  // they must be doubled (see RFC-959, chapter 7, appendix 2).
  return this.respond(
    257, '"%s" is the current directory',
    this.cwd.replace('"', '""')
  )
}

exports.auth = true
exports.handler = PWD
exports.help = 'PWD (get current working directory)'
