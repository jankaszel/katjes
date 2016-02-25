'use strict';

var fs = require('fs'),
  path = require('path'),
  express = require('express'),
  http = require('http'),
  socket_io = require('socket.io');

var app = express(),
  server = http.createServer(app),
  io = socket_io(server);

app.use(express.static(__dirname + '/public'));

function getfiles(dir, extension, callback) {
  if (arguments.length === 2) {
    callback = extension;
    extension = '*';
  }

  fs.readdir(dir, function (err, files) {
    if (err) {
      callback(err);
      res.status(500).send(JSON.stringify([]));
      console.error('error when serving \'sketches.json\': %s', err);
    } else {
      files = files.filter(function (file) {
        var p = path.join(dir, file),
          stats = fs.lstatSync(p),
          parsed = path.parse(p);

        return !stats.isDirectory() && (extension === '*' || parsed.ext === '.pde');
      });

      callback(null, files);
    }
  });
}

app.get('/sketches.json', function (req, res) {
  var dir = __dirname + '/public/processing/'

  getfiles(dir, '.js', function (err, files) {
    if (err) {
      res.status(500).send(JSON.stringify([]));
      console.error('error when serving \'sketches.json\': %s', err);
    } else {
      res.status(200).send(files.map(function (file) {
        return '/processing/' + file;
      }));
    }
  });
});

app.get('/clips.json', function (req, res) {
  var dir = __dirname + '/public/clips/'

  getfiles(dir, function (err, files) {
    if (err) {
      res.status(500).send(JSON.stringify([]));
      console.error('error when serving \'clips.json\': %s', err);
    } else {
      res.status(200).send(files.map(function (file) {
        return '/clips/' + file;
      }));
    }
  });
});

server.listen(3000, function () {
  var port = server.address().port;
  console.log('app listening at port %d', port);
});

var webs = [],
  clis = [];

function overout(list, item) {
  var i = list.indexOf(item);

  if (i > -1) {
    list.splice(i, 1);
  }
}

function broadcast(list, cmd, options) {
  list.forEach(function (socket) {
    socket.emit(cmd, options);
  });
}

function cmd_broadcast(socket, cmd, options) {
  var cloned = clone(clis);
  overout(cloned, socket);

  broadcast(cloned, 'cmd-broadcast', {
    cmd: cmd,
    options: options
  });
}

function clone(list) {
  return list.slice(0);
}

io.on('connection', function (socket) {
  console.log('connected with %s', socket.id);

  socket.on('handshake', function (data) {
    if (typeof data.identity === 'undefined') {
      console.error('handshake with %s failed, missing identity', socket.id);
      return;
    }

    switch (data.identity) {
      case 'cli':
        console.log('%s identified as type \'%s\'', socket.id, data.identity);
        clis.push(socket);

        socket.emit('handshake', {
          response: 'alright'
        });

        socket.on('cmd', function (data) {
          if (typeof data.cmd === 'undefined') {
            console.error('there has been issued no command by %s', socket.id);
            socket.emit('cmd-response', {
              response: 'fail',
              cmd: data.cmd,
              error: 'you issued no command'
            });

            return;
          }

          cmd_broadcast(socket, data.cmd, data.options);

          console.log('%s $ %s', socket.id, data.cmd,
            data.options ? 
              (Array.isArray(data.options) ?
                data.options.join(' ') :
                data.options) : '');

          switch (data.cmd) {
            case 'load': {
              broadcast(webs, 'load', {
                options: data.options
              });

              socket.emit('cmd-response', {
                response: 'alright',
                cmd: data.cmd
              });
            } break;

            case 'stop':
            case 'pause':
            case 'flush': {
              broadcast(webs, data.cmd, {});

              socket.emit('cmd-response', {
                response: 'alright',
                cmd: data.cmd
              });
            } break;
          }
        });

        socket.on('disconnect', function () {
          console.log('disconnect of %s. removing...', socket.id);
          overout(clis, socket);
        });
        break;

      case 'web':
        console.log('%s identified as type \'%s\'', socket.id, data.identity);
        webs.push(socket);

        socket.emit('handshake', {
          response: 'alright'
        });

        socket.on('disconnect', function () {
          console.log('disconnect of %s. removing...', socket.id);
          overout(webs, socket);
        });
        break;

      default:
        console.log('%s identified as unkown type \'%s\', aborting', data.identity);
    }
  });
});

process.on('SIGINT', function () {
  console.log('\nreceived SIGINT, closing ~_~');

  io.close();

  [webs, clis].forEach(function (list) {
    if (list.length > 0) {
      list.forEach(function (socket) {
        socket.disconnect();
      });
    }
  });

  console.log('closing server...');

  server.close(function () {
    // won't happen!
  });

  console.log('done'); // not actually. we're forcing him.
  process.exit(0);
});