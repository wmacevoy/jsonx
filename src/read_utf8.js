/**
 * Asynchronously load a UTF-8 string Node.js or QuickJS.
 *
 * @param {string} path  — the file path
 * @returns {any}        — the parsed JSON
 */
export async function read_utf8(path) {
  let text;
  if (typeof std !== 'undefined') {
    text = std.loadFile(path, { encoding: 'utf8' });
  } else {
    const { readFileSync } = await import('fs');
    text = readFileSync(path, 'utf8');
  }
  return text;
}
