import { read_blob }            from '../src/read_blob.js';
import { assert, assertArraysEqual }            from './asserts.js';

async function test_read_blob() {
    const bin = await read_blob("tests/data.raw");
    assert(bin.length == 32);
    for (let i=0; i<16; ++i) {
        assert(bin[i] == i);
        assert(bin[16+i] == 15*16 + i);
    }
}

await test_read_blob();
