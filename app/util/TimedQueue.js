class TimedQueue{
  constructor(items, callback) {
    this.items = [];
    this.timeout = null;
    this.callback = callback;

    if (typeof items !== 'undefined') {
      items.forEach(this.push);
    }
  }

  push(item, delay) {
    if (this.items.length === 1) {
      this._setupTimer();
    }

    this.items.push(item);
  }

  shift() {
    return this.items.shift();
  }

  _setupTimer() {
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

  resetTimer() {
    window.clearTimeout(this.timeout);
    this._setupTimer();
  }

  isScheduled() {
    return this.timeout !== null;
  }
}

module.exports = TimedQueue;
