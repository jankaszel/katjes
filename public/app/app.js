function TimedQueue(items, callback) {
  this.items = [];
  this.timeout = null;
  this.callback = callback;

  if (typeof items !== 'undefined') {
    items.forEach(this.push);
  }
}

TimedQueue.prototype.push = function (item, delay) {
  if (this.items.length === 1) {
    this._setupTimer();
  }

  this.items.push(item);
}

TimedQueue.prototype.shift = function () {
  return this.items.shift();
}

TimedQueue.prototype._setupTimer = function () {
  if (this.items.length > 0) {
    this.timeout = window.setTimeout(function () {
      var item = this.shift();

      self.callback(item);
      this._setupTimer();
    }.bind(this));
  } else {
    this.timeout = null;
  }
}

TimedQueue.prototype.resetTimer = function () {
  window.clearTimeout(this.timeout);
  this._setupTimer();
}

TimedQueue.prototype.isScheduled = function () {
  return this.timeout !== null;
}

function $(q) {
  var ret = Array.prototype.slice.call(
    document.querySelectorAll(q), 0);

  return ret;
}

function ajax(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);

  xhr.onreadystatechange = function(e) {
    if (this.readyState == 4) {
      if (this.status == 200) {
        callback(null, xhr.responseText);
      } else {
        callback(this.status);
      }
    }
  };

  xhr.send();
}

function basename(path) {
  var elements = path.split('/'),
    name = elements[elements.length-1].split('.');

  return name[0];
}

function ext(path) {
  var ext = path.split('.');

  return ext[ext.length-1];
}

function makeid() {
  return Math.random().toString(36).substring(7);
}

function makecanvas($oldCanvas) {
  var $canvas = document.createElement('canvas');
  $canvas.setAttribute('id', makeid());

  $oldCanvas.parentNode.insertBefore($canvas, $oldCanvas);
  return $canvas;
}

var types = {
  'webm': 'video/webm',
  'ogg': 'video/ogg',
  'mp4': 'video/mp4'
};

var sketches = {},
  clips = {},
  $canvas,
  $video,
  state = {
    playing: false,
    mode: null
  },
  queue,
  instance;

queue = new TimedQueue([], load_element);

function flush(callback) {
  async.waterfall([
    function (callback) {
      ajax('/sketches.json', function (err, text) {
        if (err) {
          console.error('error retrieving /sketches.json: %s', err);
          callback(err);
        } else {
          var data = JSON.parse(text);
          callback(null, data);
        }
      });
    },

    function (files, callback) {
      async.eachSeries(files, function (file, callback) {
        console.log('loading \'%s\'', file);
        ajax(file, function (err, text) {
          if (err) {
            console.error('error retrieving %s: %s', file, err);
            callback(err);
          } else {
            var id = basename(file);

            sketches[id] = text;
            callback();
          }
        })
      }, function (err) {
        callback(err);
      });
    },

    function (callback) {
      ajax('/clips.json', function (err, text) {
        if (err) {
          console.error('error retrieving /clips.json: %s', err);
          callback(err);
        } else {
          var files = JSON.parse(text), id;

          files.forEach(function (file) {
            id = basename(file);
            clips[id] = file;
          });

          console.log('retrieved clips');
          callback();
        }
      });
    }
  ], function (err) {
    if (typeof callback === 'function') {
      callback(err);
    }
  });
}


function load_element(id) {
  console.log(state.mode);

  if (Object.keys(sketches).indexOf(id) === -1) {
    console.error('sketch \'%s\' not found', id);

    if (Object.keys(clips).indexOf(id) !== -1) {
      console.log('but clip \'%s\' found', id);

      if (state.mode === 'processing') {
        if (instance) {
          instance.noLoop();
          instance = null;
        }

        $canvas.style.display = 'none';
      }

      $video.style.display = 'block';
      $video.loop = true;
      $video.controls = false;
      $video.src = clips[id];

      $video.play();
      state.mode = 'video';
    }

    return;
  }

  console.log('loading \'%s\'', id);

  if (instance) {
    instance.exit();
    instance = null;
  } else if (state.mode === 'video') { console.log('switching from video to processing');
    $video.style.display = 'none';

    $video.pause();
    $video.src = '';
  }

  $oldCanvas = $canvas;
  $canvas = makecanvas($oldCanvas);

  instance = new Processing($canvas, sketches[id]);
  instance.loop();

  window.setTimeout(function () {
    $oldCanvas.style.display = 'none';
    $canvas.style.display = 'block';

    $oldCanvas.parentNode.removeChild($oldCanvas);
  }, 100);

  state.mode = 'processing';
}

function stop() {
  if (state.playing) {
    if (state.mode === 'processing') {
      instance.noLoop();
    } else if (state.mode === 'video') {
      $video.pause();
    }

    state.playing = false;
  }
}


window.addEventListener('load', function () {
  console.log('load');

  var $body = document.getElementsByTagName('body')[0];
  $body.addEventListener('keydown', function (evt) {
    if (evt.key === ' ') {
      var isFullScreen = document.mozFullScreen;
      if (!isFullScreen) {
        $body.mozRequestFullScreen();
      } else {
        document.mozCancelFullScreen();
      }
    }
  });

  $canvas = document.getElementById('canvas');
  $video = document.getElementById('video');

  var socket = io();

  flush(function (err) {
    if (err) {
      console.error('error while flushing: %s', err);
    } else {
      console.log('flushed');

      socket.emit('handshake', {
        identity: 'web'
      });
    }
  });

  console.log('performing handshake');

  socket.on('connect', function () {
    socket.on('handshake', function (data) {
      if (typeof data.response === 'undefined') {
        console.error('invalid handshake received, panic!!1');
        return;
      } else {
        if (data.response === 'alright') {
          console.log('handshake performed, alright');
        } else {
          console.error('handshake failed');
        }
      }
    });
  });

  socket.on('load', function (data) {
    if (typeof data.options === 'undefined') {
      console.error('options are missing');
      return;
    }

    var id = data.options;

    if (Array.isArray(id)) {
      id = id.join(' ');
    }

    if (typeof id !== 'string') {
      id = toString(id);
    }

    if (queue.isScheduled) {
      queue.resetTimer();
    }

    load_element(id);
  });

  socket.on('flush', function () {
    flush(function (err) {
      if (err) {
        console.error('error while flushing: %s', err);
      } else {
        console.log('flushed');
      }
    });
  });

  socket.on('play', function () {
    if (!state.playing) {
      if (state.mode === 'processing') {
        instance.loop();
      } else if (state.mode === 'video') {
        $video.play();
      }
    }
  })

  socket.on('stop', stop);

  socket.on('pause', function () {
    if (state.playing) {
      stop();
    }

    $('canvas').forEach(function (e) {
      e.style.display = 'none';
    });
  });

  socket.on('queue', function (data) {
    var options = data.options,
      element,
      delay;

    if (options.length != 2 && (options.length != 3 || options[1] !== 'for')) {
      return;
    }

    element = options[0];
    delay = options.length === 3 ? options[2] : options[1];

    queue.push(element, delay);
  });
}, false);