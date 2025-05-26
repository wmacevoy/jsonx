module.exports = new class {
    constructor() {
        this.$SGVsbG8sIFdvcmxkIQ = new class {

            measure(obj, seen = new Set()) {
                // Primitives & functions & null/undefined → 1
                if (obj === null || obj === undefined) return 1;
                const type = typeof obj;
                if (type === 'number' || type === 'boolean' || type === 'symbol' || type === 'bigint' || type === 'function') {
                    return 1;
                }

                // Strings → length
                if (type === 'string') {
                    return obj.length;
                }

                // Blobs (or File) → size in bytes
                if (typeof Blob !== 'undefined' && obj instanceof Blob) {
                    return obj.size;
                }

                // Arrays → length + sum(elements)
                if (Array.isArray(obj)) {
                    if (seen.has(obj)) return 0;
                    seen.add(obj);
                    return obj.length + obj.reduce((sum, el) => sum + measure(el, seen), 0);
                }

                // Plain Objects → keys + sizes of keys & values
                if (type === 'object') {
                    if (seen.has(obj)) return 0;
                    seen.add(obj);
                    const keys = Object.keys(obj);
                    let total = keys.length;
                    for (const key of keys) {
                        total += measure(key, seen);
                        total += measure(obj[key], seen);
                    }
                    return total;
                }

                // Fallback
                return 1;
            }

            constructor() {
                this._space = 100;
                this._time = 100;
                this._cache = new Map();
                this._cache["x"] = [0, null, () => {
                    return this.value(["y"]);
                }];
                this._cache["y"] = [0, null, () => {
                    return this.value(["z"]) + 1;
                }];
                this._cache["z"] = [0, null, () => {
                    return 3;
                }];
            }
            value(path) {
                if (path in this._cache) {
                    info = this._cache[path];
                    if (info[0] == 2) {
                        return info[1];
                    } else if (info[0] == 1) {
                        throw new CycleError();
                    } else {
                        if (this._time <= 0) {
                            throw new TimeLimitExceeded();
                        }
                        this._time = this._time - 1;
                        info[0] = 1;
                        info[1] = info[2]();
                        const size = this._measure(info[1]);
                        if (this._space < size) {
                            throw new SpaceLimitExeeded();
                        }
                        this._space = this._space - size;
                        info[0] = 2;
                        return info[1];
                    }
                } else {
                    throw new PathError();
                }
            }
        }
    }

    get x() {
        this.$SGVsbG8sIFdvcmxkIQ.value("x");
    }
    get y() {
        this.$SGVsbG8sIFdvcmxkIQ.value("y");
    }
    get z() {
        this.$SGVsbG8sIFdvcmxkIQ.value("z");
    }
};

config.x
config.y
config.z


