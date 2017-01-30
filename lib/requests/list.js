'use strict'
/*
---
LIST:
  rfc: 'https://tools.ietf.org/html/rfc959'
  help: LIST [<SP> path] (list files)
  auth: true
  data: true
  responses:
    - 125 Data connection already open. Transfer starting
    - 150 File status okay. About to open data connection
    - 226 Transfer complete
    - 550 %s
*/

const moment = require('moment')
const sprintf = require('sprintf')
const mode = require('stat-mode')
const path = require('path')
const posix = path.posix
const sequence = require('async-sequence')
const pfy = require('../util/promisify')

function packStat (stat) {
  return [
    mode(stat).toString(),
    // stat.nlink != null ? stat.nlink : 1,
    1,
    // stat.uname || stat.uid != null ? stat.uid : 'user',
    // stat.gname || stat.gid != null ? stat.gid : 'group',
    stat.uname || 'user',
    stat.gname || 'group',
    sprintf('%12d', stat.size),
    sprintf('%12s', moment(stat.mtime).format('MMM DD HH:mm'))
  ]
}

const LIST = sequence(function * LIST (socket) {
  if (!this.listenerCount('readdir') || !this.listenerCount('stat')) {
    return this.respond(502, 'Command not implemented')
  }

  let list

  if (this.dataEncoding !== 'utf8') {
    return this.respond(550, 'data encoding must be set to utf8 for listing')
  }

  try {
    list = yield this.emitAsync('readdir', path.join(this.root, this.cwd))
  } catch (err) {
    return this.respond(550, err.message)
  }

  yield this.respond(125, 'Data connection already open. Transfer starting')

  const promises = []

  const getStat = (name) => {
    const localPathName = posix.resolve(this.cwd, name)
    const pathName = path.join(this.root, localPathName)
    promises.push(
      this.emitAsync('stat', pathName)
      .then((stat) => {
        return { name, stat }
      })
    )
  }

  for (let name of list) getStat(name)

  let stats
  try {
    stats = yield Promise.all(promises)
  } catch (err) {
    return this.respond(550, err.message)
  }

  if (stats.length) {
    const string = stats.map(({ name, stat }) => {
      return [ ...packStat(stat), name ].join(' ')
    }).join('\r\n') + '\r\n'
    this.log(string)

    yield pfy(socket.write).call(socket, string)
  }

  return this.respond(226, 'LIST Transfer complete')
})

exports.auth = true
exports.data = true
exports.handler = LIST
exports.help = 'LIST [<SP> path] (list files)'
