import { encode as js64encode, decode as js64decode } from '../src/js64.js';
import { assertArraysEqual }            from './asserts.js';

const quiet = true;
function test_js64_round_trip(blob) {
    const js64 = js64encode(blob);
    if (!quiet) console.log(`enc(${blob}) -> ${js64}`)
    const back = js64decode(js64);
    if (!quiet) console.log(`dec(${js64}) -> ${back}`)
    assertArraysEqual(back, blob);
}

function test_js64() {
    {
        const blob = new Uint8Array();
        test_js64_round_trip(blob);
    }

    for (let b0 = 0; b0 < 256; ++b0) {
        const blob = new Uint8Array([b0]);
        test_js64_round_trip(blob);
    }

    for (let b0 = 0; b0 < 256; ++b0) {
        for (let b1 = 0; b1 < 256; ++b1) {
            const blob = new Uint8Array([b0, b1]);
            test_js64_round_trip(blob);
        }
    }

    for (let b0 = 0; b0 < 256; b0 += 5) {
        for (let b1 = 0; b1 < 256; ++b1) {
            for (let b2 = 0; b2 < 256; ++b2) {
                const blob = new Uint8Array([b0, b1, b2]);
                test_js64_round_trip(blob);
            }
        }
    }
    console.log('test_js64 ok')
}

test_js64();