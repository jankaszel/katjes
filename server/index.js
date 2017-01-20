const createServer = require('./createServer');

module.exports = function startServer(port) {
  const server = createServer();

  return new Promise((resolve, reject) => {
    const listener = server.listen(port, err => {
      if (!err) {
        resolve(listener);
      } else {
        reject(err);
      }
    });
  });
};
