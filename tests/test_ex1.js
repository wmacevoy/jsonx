import { read_utf8 }            from '../src/read_utf8.js';
import { assert, assertArraysEqual } from './asserts.js';
import ex1 from './ex1.js';

async function test_ex1() {
    const json = JSON.parse(await read_utf8("tests/ex1.json"));

    assert(ex1.x === json.x);
    assert(ex1.y === json.y);
    assert(ex1.z === json.z);
}

test_ex1();