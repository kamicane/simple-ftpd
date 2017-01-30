# simple-ftpd

`simple-ftpd` is a event based ftp-server for node.js.

## Features

- Supports multiple modern ftp clients such as FileZilla, WinSCP, Transmission.
- A real File System is not required.
- For now it only supports basic authentication.
- It supports passive mode only.
- It only supports streams for writing and reading files.
- It currently only supports a subset of FTP commands, but it should be enough for any modern FTP client.
- It is intended to be used mainly to create local network ftp servers.

Used [pyftpdlib](https://github.com/giampaolo/pyftpdlib) extensively as a reference for the FTP protocol specification, as reading RFC documents is super boring :=)

## Install

```sh
yarn add simple-ftpd
# or
npm install simple-ftpd --save
```

```js
const ftpd = require('ftpd')
```

## API

Syntax: `ftpd(opts, sessionCallback)` or `ftpd(host:port, sessionCallback)`

Should you need more control, the `ftpd` function will return a [`net.Server`](https://nodejs.org/api/net.html#net_class_net_server) instance.

## Example

Simple, fs-based ftp server implementation example:

```js
'use strict'

const ftpd = require('ftpd')

ftpd({ host: '127.0.0.1', port: 1337, root: '/public/files' }, (session) => {

  session.on('pass', (username, password, cb) => {
    if (username === 'superadmin' && password === '53cr3t') {
      session.readOnly = false
      session.root = '/private/secret/files'
      cb(null, 'Welcome admin')
    } else {
      cb(null, 'Welcome guest')
    }
  })

  session.on('stat', fs.stat)
  // AKA
  // session.on('stat', (pathName, cb) => {
  //  fs.stat(pathName, cb)
  // })

  session.on('readdir', fs.readdir)
  // AKA
  // session.on('readdir', (pathName, cb) => {
  //   fs.readdir(pathName, cb)
  // })

  session.on('read', (pathName, offset, cb) => {
    cb(null, fs.createReadStream(pathName, { start: offset }))
  })

  session.on('write', (pathName, offset, cb) => {
    cb(null, fs.createWriteStream(pathName, { start: offset }))
  })

  // I'd do some checking if I were you, but hey.

  session.on('mkdir', fs.mkdir)
  session.on('unlink', fs.unlink)
  session.on('rename', fs.rename)
  session.on('remove', require('rimraf'))
})
```

## Options

| option | | description |
| --- | --- | --- |
| `host` | required | Must be a valid ipv4 address (for now). Defaults to `127.0.0.1` |
| `port` | required | Server port. Defaults to `1337`. |
| `readOnly` | optional | Disables client write requests. Defaults to `true`. Can be overridden on a connection-basis by setting the readOnly property on the session object before logging in. |
| `root` | optional | The path passed to events will always be joined to `root`. Can be overridden on a connection-basis by setting the root property on the session object before logging in. The ftp client will not see `root`, and will think he's at `/`. This is simply a convenience to avoid manually joining the path you get in every event. |
| `maxConnections` | optional | Maximum number of server connections. Defaults to 10. |

Passive connections will be initialized on an unused port assigned by the os.

Instead of options, you can pass `${host}:${port}` (`"192.168.1.10:1337"`).

## Events

Every event gets some arguments and a node-style callback you must call with an Error object (if any) and results.

If you do not listen to a specific event, then that feature will become unavailable to the client.
For example, if you do not listen to `write` events, the client will get a 502 error when trying to write files.

### `pass [username, password, cb]`

The client wants to login with `username` and `password`.
Will consider the user logged in if no error is passed to `cb()`

User names are always accepted, because (from pyftpdlib):

> In order to prevent a
> malicious client from determining valid usernames on a server,
> it is suggested by RFC-2577 that a server always return 331 to
> the USER command and then reject the combination of username
> and password for an invalid username when PASS is provided later.

### `read [pathName, offset, cb]`:

The client wants to read the file at `pathName`, starting at `offset`.
Requires a readable stream to be passed as `cb(null, readStream)`.

### `write [pathName, offset, cb]`:

The client wants to write a file at `pathName`, starting at `offset`.
Requires a writable stream to be passed as `cb(null, writeStream)`.

### `stat [pathName, cb]`:

the client wants the stats to a file or directory at `pathName`.
Requires a `fs.stat`-like object to be passed as `cb(null, stat)`.

Properties are:

```js
{
  // fs.stat mode
  mode: 16822,
  //  size in bytes
  size: 12345,
  // lastModifiedTime as Date or number (or whatever gets parsed by moment)
  mtime: Date.now(),
  // optional, will use it for display if available, otherwise "owner"
  uname: 'kamicane',
  // optional, will use it for display if available, otherwise "group"
  gname: 'admins',
}
```

### `readdir [pathName, cb]`:

The client wants a list of files in the directory `pathName`. requires an array of file names, relative to pathName, to be passed as `cb(null, list)`.

### `mkdir [pathName, cb]`:

The client wants to create a directory at `pathName`.
Will consider the directory written if no error is passed to `cb()`

### `unlink [pathName, cb]`:

The client wants to delete the file at `pathName`.
Will consider the file deleted if no error is passed to `cb()`

### `remove [pathName, cb]`:

The client wants to remove a directory, and all of its contents, at `pathName`.
Will consider the directory and its contents removed if no error is passed to `cb()`

### `rename [fromName, toName, cb]`:

The client wants to rename a file or directory, from `fromName` to `toName`.
Will consider the file renamed if no error is passed to `cb()`

## CLI

When installed globally, ftpd will provide a small cli, which will quickly create a fs-based ftp server.

You can use it like this:

```sh
ftp-server /public/files --host 192.168.0.1 --port 1234 --max-connections 10
```

* `--host` will default to `127.0.0.1`
* `--port` will default to `1337`
* `--max-connections` will default to `10`
* `--read-only` will default to `true`
* Unless specified, the ftp root will default to `process.cwd()`

The cli will accept any login, so be careful when setting `--read-only` to `false`.

## License

MIT
