'use strict';

const startServer = require('./server');

startServer(process.env.PORT || 3000).then(server => {
  // eslint-disable-next-line no-console
  console.log(`katjes listening at port ${server.address().port}`);
});
