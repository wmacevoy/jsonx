/**
 * Synchronously load & parse a JSON file in either Node.js or QuickJS.
 *
 * @param {string} path  — the file path
 * @returns {any}        — the parsed JSON
 */
export function loadJsonSync(path) {
    let text;
  
    // Node.js: use fs.readFileSync
    if (typeof process !== 'undefined' &&
        typeof require === 'function' &&
        process.versions?.node) {
      const fs = require('fs');
      text = fs.readFileSync(path, 'utf8');
    }
    // QuickJS: use std.loadFile
    else if (typeof std !== 'undefined' && typeof std.loadFile === 'function') {
      text = std.loadFile(path, { encoding: 'utf8' });
    }
    else {
      throw new Error('Unsupported runtime: cannot load files');
    }
    const json = JSON.parse(text);
    return json;
  }
