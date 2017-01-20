'use strict';

module.exports = function attachDevServer(app) {
  const webpack = require('webpack');
  const webpackMiddleware = require('webpack-dev-middleware');
  const webpackConfig = require('../webpack.config');

  const compiler = webpack(webpackConfig);
  const {publicPath} = webpackConfig.output;

  app.use(webpackMiddleware(compiler, {publicPath}));
}
