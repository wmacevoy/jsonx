/**
 * Compute SHA-256 hash of an ArrayBuffer, returning a new 32-byte ArrayBuffer.
 * @param {ArrayBuffer} buf  – input data
 * @returns {ArrayBuffer}    – 32-byte hash digest
 */
export function sha256(buf) {
    const bytes = new Uint8Array(buf);
  
    // --- 1) Pre-processing (padding) ---
    const bitLen = bytes.length * 8;
    // append 0x80, then pad with zeros until length ≡ 56 mod 64
    const withOne = new Uint8Array(bytes.length + 1);
    withOne.set(bytes);
    withOne[bytes.length] = 0x80;
    let padLen = withOne.length;
    while (padLen % 64 !== 56) padLen++;
    const padded = new Uint8Array(padLen + 8);
    padded.set(withOne);
    // append 64-bit big-endian length
    const dv = new DataView(padded.buffer);
    dv.setUint32(padded.length - 8, Math.floor(bitLen / 0x100000000), false);
    dv.setUint32(padded.length - 4, bitLen >>> 0, false);
  
    // --- 2) Initialize hash values H₀…H₇ ---
    let H = new Uint32Array([
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ]);
  
    // --- 3) SHA-256 constants K[0..63] ---
    const K = new Uint32Array([
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
      0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
      0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
      0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
      0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
      0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
      0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
      0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
      0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ]);
  
    // Helper: right-rotate
    const ROTR = (w, n) => (w >>> n) | (w << (32 - n));
  
    // Process each 512-bit chunk
    const w = new Uint32Array(64);
    for (let i = 0; i < padded.length; i += 64) {
      // 3.1) Prepare message schedule W[0..63]
      for (let t = 0; t < 16; t++) {
        w[t] = dv.getUint32(i + t*4, false);
      }
      for (let t = 16; t < 64; t++) {
        const s0 = ROTR(w[t-15], 7)  ^ ROTR(w[t-15], 18) ^ (w[t-15] >>> 3);
        const s1 = ROTR(w[t-2], 17)  ^ ROTR(w[t-2], 19)  ^ (w[t-2] >>> 10);
        w[t] = (w[t-16] + s0 + w[t-7] + s1) >>> 0;
      }
  
      // 3.2) Initialize working vars a..h with current H
      let [a,b,c,d,e,f,g,h] = H;
  
      // 3.3) Compression rounds
      for (let t = 0; t < 64; t++) {
        const S1   = ROTR(e,6) ^ ROTR(e,11) ^ ROTR(e,25);
        const ch   = (e & f) ^ (~e & g);
        const temp1= (h + S1 + ch + K[t] + w[t]) >>> 0;
        const S0   = ROTR(a,2) ^ ROTR(a,13) ^ ROTR(a,22);
        const maj  = (a & b) ^ (a & c) ^ (b & c);
        const temp2= (S0 + maj) >>> 0;
  
        h = g;
        g = f;
        f = e;
        e = (d + temp1) >>> 0;
        d = c;
        c = b;
        b = a;
        a = (temp1 + temp2) >>> 0;
      }
  
      // 3.4) Compute intermediate hash value
      H[0] = (H[0] + a) >>> 0;
      H[1] = (H[1] + b) >>> 0;
      H[2] = (H[2] + c) >>> 0;
      H[3] = (H[3] + d) >>> 0;
      H[4] = (H[4] + e) >>> 0;
      H[5] = (H[5] + f) >>> 0;
      H[6] = (H[6] + g) >>> 0;
      H[7] = (H[7] + h) >>> 0;
    }
  
    // --- 4) Produce the final hash as ArrayBuffer ---
    const out = new ArrayBuffer(32);
    const outDv = new DataView(out);
    for (let i = 0; i < 8; i++) {
      outDv.setUint32(i * 4, H[i], false);
    }
    return new Uint8Array(out);
  }

/**
 * Convert an ArrayBuffer to a hex-encoded string.
 * @param {ArrayBuffer} buffer
 * @returns {string} Hex string (lowercase), two chars per byte
 */
export function arrayBufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer))                  // view bytes  [oai_citation:0‡Stack Overflow](https://stackoverflow.com/questions/40031688/how-can-i-convert-an-arraybuffer-to-a-hexadecimal-string-hex?utm_source=chatgpt.com)
      .map(b => b.toString(16).padStart(2, '0'))                // byte → hex, pad to 2 chars  [oai_citation:1‡Stack Overflow](https://stackoverflow.com/questions/40031688/how-can-i-convert-an-arraybuffer-to-a-hexadecimal-string-hex?utm_source=chatgpt.com)
      .join('');                                                // join into one continuous string
}


// Legal ASCII Javascript Identifier characters, in ASCII/Unicode sorted order
export const alphabet = "$0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz";
let _tebahpla = null;
/**
 * encode(blob) → string
 *
 * @param UInt8Array blob
 * @returns {string}  encoded with 6-bit chunks ↔ js64 alphabet
 */
export function encode(blob) {
    const js64len = ((blob.byteLength * 4 + 2) / 3) | 0;
    const js64 = new Array(js64len);
    let code = 0;    // accumulator for bits
    let bits = 6;    // how many bits are in `code` (start with leading 0 -> '$')
    let byte = 0;    // index into the byte array
    // 1 extra digit for leading '$'
    for (let i = 0; i <= js64len; ++i) {
        js64[i] = alphabet.charAt(code & 0x3F);
        code = (code >> 6);
        bits -= 6;
        if (bits < 6 || i == js64len) {
            code = code | (blob[byte] << bits);
            bits += 8;
            byte += 1;
        }
    }
    return js64.join("");
}

/**
 * Decode a js64 string back into a Uint8Array of bytes.
 * @param {string} str  — output from js64encode
 * @returns {Uint8Array} original byte sequence
 */
export function decode(js64) {
    // only create lookup if needed (decode is rare)
    if (_tebahpla == null) {
        _tebahpla = new Uint8Array(128).fill(255);
        for (let i = 0; i < alphabet.length; i++) {
            _tebahpla[alphabet.charCodeAt(i)] = i;
        }
    }

    if (js64.length < 1 || js64.charAt(0) !== '$') {
        throw TypeError("Not JS64");
    }
    const js64len = js64.length - 1;
    const blob = new Uint8Array((js64len * 3) >> 2);

    let code = 0;   // accumulator of bits
    let bits = 0;   // how many bits in `code`
    let byte = 0;   // index into `blob`

    for (let i = 0; i < js64len; i++) {
        const v = _tebahpla[js64.charCodeAt(i + 1)];
        if (v == 255) {
            throw TypeError("Not JS64");
        }
        code = code | (v << bits);
        bits += 6;

        // whenever we have at least 8 bits, emit one byte
        if (bits >= 8 || i == js64len) {
            blob[byte] = code & 0xFF;
            code = code >> 8;
            bits -= 8;
            byte += 1;
        }
    }

    return blob;
}

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
  
  export function measure(obj, seen = new Set()) {
    // Primitives & functions & null/undefined → 1
    if (obj == null) return 1;
    const type = typeof obj;
    if (["number","boolean","symbol","bigint","function"].includes(type)) {
      return 1;
    }
    if (type === "string") {
      return obj.length;
    }
    if (Array.isArray(obj)) {
      if (seen.has(obj)) return 0;
      seen.add(obj);
      return obj.length +
        obj.reduce((sum, el) => sum + this.measure(el, seen), 0);
    }
    if (type === "object") {
      if (seen.has(obj)) return 0;
      seen.add(obj);
      let total = 0;
      for (const key of Object.keys(obj)) {
        total += this.measure(key, seen);
        total += this.measure(obj[key], seen);
      }
      return total;
    }
    return 1;
  }
