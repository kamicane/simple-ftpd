'use strict'
/*
---
PASS:
  rfc: 'https://tools.ietf.org/html/rfc959'
  help: PASS [<SP> password] (set user password)
  auth: false
  data: false
  responses:
    - 230 User %s logged in
    - 503 User already authenticated
    - 503 Login with USER first
    - 530 Authentication failed, USER '%s' failed login
    - 530 Anonymous access not allowed
*/

function PASS (password) {
  const username = this.username
  if (!username) return this.respond(503, 'Login with USER first')
  if (this.authenticated) return this.respond(503, 'User already authenticated')

  return this.emitAsync('pass', username, password)
  .then(() => {
    this.authenticated = true
    return this.respond(230, 'User %s logged in', username)
  })
  .catch((err) => {
    return this.respond(530, 'Authentication failed: %s', err.message)
  })
}

exports.handler = PASS
exports.help = 'PASS [<SP> password] (set user password)'
