// Utility to get a code point from a 1-char string
function ord(ch, i = 0) {
    // codePointAt handles astral & BMP; returns undefined if out-of-bounds
    const cp = ch.codePointAt(i);
    if (cp === undefined) throw new Error(`ord() out of range on “${ch}”`);
    return cp;
  }
  
  export class UTF8Scanner {
    /**
     * @param {Uint8Array} bytes
     * @param {number} [beginIndex=0]
     * @param {number} [endIndex=bytes.length]
     */
    constructor(bytes, beginIndex = 0, endIndex = null) {
      this.bytes      = bytes;
      this.beginIndex = Number(beginIndex);
      this.endIndex   = endIndex === null ? bytes.length : Number(endIndex);
      this.reset();
    }
  
    /** Move to the first valid code-point boundary ≥ beginIndex */
    reset() {
      this.at = this.beginIndex;
      while (
        this.at < this.endIndex &&
        (this.bytes[this.at] & 0x80) !== 0
      ) {
        this.at++;
      }
      this.code = this._decodeAt(this.at);
    }
  
    /** Have we walked past the end? */
    isEnd() {
      return this.at >= this.endIndex;
    }
  
    /** Save current position (for backtracking) */
    save() {
      return this.at;
    }
  
    /**
     * Restore to a saved position (and re-decode code)
     * @param {number} pos
     */
    restore(pos) {
      if (this.at !== pos) {
        this.at   = pos;
        this.code = this._decodeAt(pos);
      }
    }
  
    /** Step backward to the previous code-point boundary */
    reject() {
      if (this.at <= this.beginIndex) return;
      this.at--;
      while (
        this.at >= this.beginIndex &&
        (this.bytes[this.at] & 0x80) !== 0
      ) {
        this.at--;
      }
      this.code = this._decodeAt(this.at);
    }
  
    /** Step forward to the next code-point boundary */
    accept() {
      if (this.at >= this.endIndex) return;
      this.at++;
      while (
        this.at < this.endIndex &&
        (this.bytes[this.at] & 0x80) !== 0
      ) {
        this.at++;
      }
      this.code = this._decodeAt(this.at);
    }
  
    /**
     * Decode the code point at `pos`.
     * @returns {number} 0…0x10FFFF, or `-1` if pos ≥ endIndex.
     */
    _decodeAt(pos) {
      if (pos >= this.endIndex) return -1;
      const b0 = this.bytes[pos];
      let cp = 0, len = 0;
  
      // Determine length and initial bits
      if ((b0 & 0x80) === 0)        { cp = b0;      len = 1; }
      else if ((b0 & 0xE0) === 0xC0){ cp = b0 & 0x1F; len = 2; }
      else if ((b0 & 0xF0) === 0xE0){ cp = b0 & 0x0F; len = 3; }
      else if ((b0 & 0xF8) === 0xF0){ cp = b0 & 0x07; len = 4; }
      else throw new Error(`Invalid UTF-8 start byte at ${pos}: 0x${b0.toString(16)}`);
  
      // Bounds check
      if (pos + len > this.endIndex) {
        throw new Error(`Truncated UTF-8 sequence at ${pos}`);
      }
      // Accumulate continuation bits
      for (let i = 1; i < len; i++) {
        const bx = this.bytes[pos + i];
        if ((bx & 0xC0) !== 0x80) {
          throw new Error(`Invalid UTF-8 continuation at ${pos + i}: 0x${bx.toString(16)}`);
        }
        cp = (cp << 6) | (bx & 0x3F);
      }
      return cp;
    }
  }
  
  export class JSONXParser {
    /**
     * @param {Uint8Array} srcBytes  – your incoming JSONX buffer
     */
    constructor(srcBytes) {
      this.scanner = new UTF8Scanner(srcBytes);
    }
  
    /** End-of-file (scanner.code === -1) */
    eof() {
      return this.scanner.code === -1;
    }
  
    /** End-of-line (LF or CRLF), consumes it if present */
    eol() {
      const c = this.scanner.code;
      if (c === 0x0A || c === -1) {        // '\n' or EOF
        this.scanner.accept();
        return true;
      }
      if (c === 0x0D) {                    // '\r'
        this.scanner.accept();
        if (this.scanner.code === 0x0A) {
          this.scanner.accept();
        }
        return true;
      }
      return false;
    }
  
    /** Strip a comment if present. Returns true if a comment was consumed. */
    comment() {
      const c = this.scanner.code;
      // # line comment
      if (c === ord('#')) {
        while (!this.eol()) this.scanner.accept();
        return true;
      }
      // C/C++ style
      if (c === ord('/')) {
        this.scanner.accept();
        const d = this.scanner.code;
        // // line
        if (d === ord('/')) {
          while (!this.eol()) this.scanner.accept();
          return true;
        }
        // /* block */
        if (d === ord('*')) {
          this.scanner.accept();
          let nest = 1;
          while (!this.eof() && nest > 0) {
            const x = this.scanner.code;
            this.scanner.accept();
            if (x === ord('/') && this.scanner.code === ord('*')) {
              nest++; this.scanner.accept();
            } else if (x === ord('*') && this.scanner.code === ord('/')) {
              nest--; this.scanner.accept();
            }
          }
          return nest === 0;
        }
        // not actually a comment → back up
        this.scanner.reject();
        return false;
      }
      return false;
    }
  
    /** Consume and report any whitespace. */
    ws() {
      const W = new Set([0x20,0x09,0x0A,0x0D]);  // ' ', '\t', '\n', '\r'
      let seen = false;
      while (W.has(this.scanner.code)) {
        this.scanner.accept();
        seen = true;
      }
      return seen;
    }
  
    /** Consume any mix of whitespace + comments. */
    ws_or_comment() {
      let saw = false;
      while (this.ws() || this.comment()) {
        saw = true;
      }
      return saw;
    }
  
    /**
     * Match the exact string `text` (e.g. "null" or "true").
     * Returns `true` iff matched (scanner advanced), else rolls back.
     */
    match(text) {
      const save = this.scanner.save();
      for (let i = 0; i < text.length; i++) {
        if (this.scanner.code !== ord(text, i)) {
          this.scanner.restore(save);
          return false;
        }
        this.scanner.accept();
      }
      return true;
    }
  
    /** Parse `null` literal. */
    literalNull() {
      if (this.match("null")) {
        return { type: "literal", value: null };
      }
      return null;
    }
  
    /** Parse `true`/`false` literals. */
    literalBoolean() {
      if (this.match("true"))  return { type: "literal", value: true };
      if (this.match("false")) return { type: "literal", value: false };
      return null;
    }
  
    /** Try any literal. */
    literal() {
      return this.literalNull() || this.literalBoolean();
    }
  
    /** Try any JSONX value (currently only literals). */
    any() {
      const save = this.scanner.save();
      this.ws_or_comment();
      const lit = this.literal();
      if (lit !== null) {
        return lit;
      }
      this.scanner.restore(save);
      return null;
    }
  }