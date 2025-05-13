
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
    const js64len = ((blob.length * 4 + 2) / 3) | 0;
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
