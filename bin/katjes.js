#!/usr/bin/env node
'use strict';

var socket = require('socket.io-client')('http://localhost:3000'),
  readline = require('readline');

socket.on('connect', function () {
  console.log('connected');

  socket.emit('handshake', {
    identity: 'cli'
  });

  socket.on('handshake', function (data) {
    if (typeof data.response === 'undefined') {
      console.error('invalid handshake received, panic!!1');

      socket.disconnect();
      process.exit(1);
    } else {
      if (data.response === 'alright') {
        request();
      } else {
        console.log('hummm, bad handshake: %s', data.response);
        process.exit(0);
      }
    }
  });
});

socket.on('cmd-response', function (data) {
  if (typeof data.response === 'undefined') {
    console.error('invalid cmd-response received:\n%s', JSON.stringify(data));
  } else {
    if (data.response === 'alright') {
      console.log('executed \'%s\' correctly', data.cmd);
    } else {
      console.error('there has been an error when executing \'%s\':\n%s', data.cmd, data.error);
    }
  }

  request();
});

socket.on('cmd-broadcast', function (data) {
  var output = data.cmd;

  if (typeof data.options !== 'undefined') {
    if (!Array.isArray(data.options)) {
      data.options = [data.options];
    }

    output += ' ' + data.options.join(' ');
  }

  console.log('$ %s', output);
});

socket.on('disconnect', function () {
  rl.close();
  console.log('connection lost ~_~');
});

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('close', function () {
  console.log('');
});

rl.on('SIGINT', function () {
  console.log('');
  process.emit('SIGINT');
});

function request() {
  rl.question('> ', function (input) {
    console.dir(input);
    var input = input.split(' ');
    var cmd = input[0];

    switch (cmd) {
      case 'load':
        input.splice(0, 1);

        socket.emit('cmd', {
          cmd: 'load',
          options: input.join(' ')
        });
        break;

      case 'pause':
      case 'stop':
      case 'flush':
        socket.emit('cmd', {
          cmd: cmd
        });
        break;

      case 'exit':
      case 'quit':
        console.log('exiting');

        rl.close();
        socket.disconnect();
        break;

      default:
        console.log('unknown command, please try again');

        request();
        break;
    }
  });
}

process.on('SIGINT', function () {
  console.log('received SIGINT, disconnecting...');

  if (rl) {
    rl.close();
  }

  socket.disconnect();
});