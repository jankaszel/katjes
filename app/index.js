/* global Processing */
require('whatwg-fetch');
require('processing-js');

const io = require('socket.io-client');
const TimedQueue = require('./util/TimedQueue');
const {$} = require('./util/dom');

require('./layout/katjes.css');


function basename(path) {
  var elements = path.split('/'),
    name = elements[elements.length-1].split('.');

  return name[0];
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

async function fetchJSON(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`error retrieving ${url}: ${response.status}`);
  } else {
    return await response.json();
  }
}

function fetchSketches() {
  return fetchJSON('/sketches.json');
}

async function fetchSketchData(sketchFile) {
  const response = await fetch(sketchFile);
  if (!response.ok) {
    throw new Error(`Error fetching ${sketchFile}`);
  }
  
  const sketchText = await response.text();
  const id = basename(sketchFile);
  sketches[id] = sketchText;
}

function fetchSketchesData(sketches) {
  const promises = sketches.map(fetchSketchData);
  return Promise.all(promises);
}

async function fetchClips() {
  const clipFiles = await fetchJSON('/clips.json');

  clipFiles.forEach(clipFile => {
    const id = basename(clipFile);
    clips[id] = clipFile;
  });
}

function flush() {
  const sketchesPromise = fetchSketches()
    .then(fetchSketchesData);
  
  return Promise.all([fetchClips(), sketchesPromise]);
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

  let $oldCanvas = $canvas;
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

  flush().then(() => {
    console.log('flushed');

    socket.emit('handshake', {
      identity: 'web'
    });
  }).catch(err => {
    console.error('error while flushing:', err);
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