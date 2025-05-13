import { read_utf8 }            from '../src/read_utf8.js';
import { assert, assertArraysEqual }            from './asserts.js';

async function test_read_utf8() {
    const text = await read_utf8("tests/ex1.json");
    const ex1 = JSON.parse(text);
    assert(ex1.x === 4);
    assert(ex1.y === 4);
    assert(ex1.z === 3);
    console.log("test_read_utf8 ok");
}

await test_read_utf8();
