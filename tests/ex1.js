export default new class ConstraintEngine {
    constructor() {
      this.engine = new class {
        constructor() {
          this._space = 100;
          this._time  = 100;
          this._cache = new Map([
            ["x", [0, null, () => this.value("y")]],
            ["y", [0, null, () => this.value("z") + 1]],
            ["z", [0, null, () => 3]]
          ]);
        }
  
        measure(obj, seen = new Set()) {
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
          const size = this.measure(info[1]);
          if (this._space < size) {
            throw new Error("Space limit exceeded");
          }
          this._space -= size;
          info[0] = 2;
          return info[1];
        }
      }();
    }
  
    get x() { return this.engine.value("x"); }
    get y() { return this.engine.value("y"); }
    get z() { return this.engine.value("z"); }
  }();