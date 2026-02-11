const path = require('path');

function curryRequire(basePath, localRequire) {
  const req = localRequire || require;
  return function curriedRequire(relativePath) {
    if (!relativePath) {
      throw new Error('curriedRequire requires a path');
    }
    if (relativePath.startsWith('/')) {
      return req(relativePath);
    }
    if (!basePath) {
      return req(relativePath);
    }
    return req(path.join(basePath, relativePath));
  };
}

module.exports = curryRequire;
