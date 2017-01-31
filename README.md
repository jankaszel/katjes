# katjes

[![Travis](https://travis-ci.org/fallafeljan/katjes.svg)]()

`katjes` is a system for displaying visual content, intenden to be accompanied
by audio. It's based on web technologies and is open source, therefore
hackeable. Visual content can be interactive sketches
([Processing](https://processing.org/)) and video clips.

The system consists of a central server, independent visualizers (slaves), and
clients who influence the visuals. All these actors communicate with the server
via [WebSockets](https://tools.ietf.org/html/rfc6455).

## Setup

Install via `npm install`. Start server via `node .`. Link to cli-client via
`npm link` and control server via `katjes` from anywhere, even a different
machine. Visuals are served via HTTP.


## Sample Material

There are sample files included in `public/clips` and `public/processing`.


## REPL Commands

* `load`: Load a new processing visual or a new movie clip. Emit file extension.
* `pause`, `stop`: Might do the same: Just stop any animation or movie clip.
* `play`: Opposite of `pause` or `stop`.
* `flush`: Check for new processing visuals or movie clips (the folders are
  scanned at startup)
* `exit`, `quit`: Close connection to server.

🐱
