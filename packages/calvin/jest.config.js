/* eslint-disable */
const base = require('../../jest.config.base');
const pkg = require('./package.json');
/* eslint-enable */

module.exports = {
  ...base,
  name: pkg.name,
  displayName: pkg.name,
};
