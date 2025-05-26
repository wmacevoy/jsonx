import * as jsonx from 'jsonx';

export default new class ConstraintEngine {
    constructor() {
      // js64-encoded sha256 hash of ex1.jsonx
      this.$N5XK6z_AmeOk26IwAyiDDdQ9QwL9JJt$9eTa2e72fG9 = new class {
        constructor() {
          this._space = 100;
          this._time  = 100;
          this._cache = new Map([
            ["x", [0, null, () => this.value("y")]],
            ["y", [0, null, () => this.value("z") + 1]],
            ["z", [0, null, () => 3]]
          ]);
        }


  
  
        value(path) {
          if (!this._cache.has(path)) {
            throw new Error(`Unknown path: ${path}`);
          }
          const info = this._cache.get(path);
          // state: 0=unevaluated, 1=in-progress, 2=done
          if (info[0] === 2) {
            return info[1];
          }
          if (info[0] === 1) {
            throw new Error("Cycle detected");
          }
          if (this._time <= 0) {
            throw new Error("Time limit exceeded");
          }
          this._time--;
          info[0] = 1;
          info[1] = info[2]();
          const size = jsonx.measure(info[1]);
          if (this._space < size) {
            throw new Error("Space limit exceeded");
          }
          this._space -= size;
          info[0] = 2;
          return info[1];
        }
      }();
    }
  
    get x() { return this.$N5XK6z_AmeOk26IwAyiDDdQ9QwL9JJt$9eTa2e72fG9.value("x"); }
    get y() { return this.$N5XK6z_AmeOk26IwAyiDDdQ9QwL9JJt$9eTa2e72fG9.value("y"); }
    get z() { return this.$N5XK6z_AmeOk26IwAyiDDdQ9QwL9JJt$9eTa2e72fG9.value("z"); }
  }();