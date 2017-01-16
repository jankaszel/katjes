# katjes

Install via `npm install`. Start server via `node .`. Link to cli-client via
`npm link` and control server via `katjes` from anywhere, even a different
machine. Visuals are served via HTTP.


## Sample Material

There are sample files included in `public/clips` and `public/processing`.


## CLI Commands

* `load`: Load a new processing visual or a new movie clip. Emit file extension.
* `pause`, `stop`: Might do the same: Just stop any animation or movie clip.
* `play`: Opposite of `pause` or `stop`.
* `flush`: Check for new processing visuals or movie clips (the folders are
  scanned at startup)
* `exit`, `quit`: Close connection to server.


### Upcoming

* [ ] Refactor client code. Use modules, maybe ES6.
* [ ] `queue`: Create playlists beforehand or on the fly with track durations,
  similarly to an audio player.
* [ ] Make the server a client itself, too.

:cat:
