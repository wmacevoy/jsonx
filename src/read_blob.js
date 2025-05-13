/**
 * Concatenate a list of Uint8Array into one Uint8Array.
 *
 * @param {Uint8Array[]} arrays
 * @returns {Uint8Array}
 */
function concatUint8Arrays(arrays) {
  // 1) Compute total length
  let totalLength = 0;
  for (const arr of arrays) {
    totalLength += arr.length;
  }

  // 2) Allocate result
  const result = new Uint8Array(totalLength);

  // 3) Copy each one in at the right offset
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }

  return result;
}

/**
 * read_blob(path) → Promise<Uint8Array>
 *
 * Works in QuickJS (using os.open/ os.read / os.close)
 * and in Node.js (using fs.readFileSync).
 */
export async function read_blob(path) {
  // ─── QuickJS branch ───
  if (typeof os !== "undefined" && typeof os.open === "function") {
    const blocks = [];
    const fd = os.open(path, os.O_RDONLY);
    if (fd < 0) {
      throw new Error(`Cannot open file: ${path}`);
    }
    try {
      while (true) {
        const block = new Uint8Array(64 * 1024);
        const bytesRead = os.read(fd, block, 0, block.length);
        if (bytesRead <= 0) {
          break;
        }
        if (bytesRead === block.length) {
          blocks.push(block);
        } else {
          blocks.push(block.subarray(0, bytesRead));
        }
      }
    } finally {
      os.close(fd);
    }
    return concatUint8Arrays(blocks);
  }

  // ─── Node.js branch ───
  else {
    const { readFileSync } = await import("fs");
    const buf = readFileSync(path);
    // Buffer is a Uint8Array subclass, so just return it
    return buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  }
}