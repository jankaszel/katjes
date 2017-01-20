const path = require('path');
const find = require('find');

module.exports = function findFiles(pattern, directory) {
  if (!directory) {
    [directory, pattern] = [pattern, directory];
  }

  const args = pattern ?
    new Array(pattern, directory) : new Array(directory);

  if (args.length > 2) {
    return Promise.reject(
      'Maximum of two arguments is allowed in `findFiles`');
  } else {
    return new Promise((resolve, reject) => {
      find.file(...args, files => {
        const relativeFiles = files
          .map(file => path.relative(directory, file))
          .filter(file => file.charAt(0) !== '.');

        resolve(relativeFiles);
      }).error(err => reject(err));
    });
  }
}
