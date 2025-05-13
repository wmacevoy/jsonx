/**
 * Throw if `cond` is falsy.
 * @param {boolean} cond — the condition you expect to be true
 * @param {string} [msg] — optional message for the Error
 */
export function assert(cond, msg = "") {
    if (!cond) {
        throw new Error(msg || 'Assertion failed');
    }
}

export function assertArraysEqual(a, b, msg = "") {
    if (a.length !== b.length) {
        throw new Error(msg || `Array lengths differ: ${a} vs ${b}`);
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            throw new Error(
                msg || `Arrays differ at index ${i}: ${a[i]} ≠ ${b[i]}`
            );
        }
    }
}
