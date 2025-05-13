import { read_blob }            from '../src/read_blob.js';
import { sha256, arrayBufferToHex } from '../src/sha256.js';
import { encode as js64encode } from '../src/js64.js';
import { assert, assertArraysEqual }            from './asserts.js';


async function test_sha256() {
    const blob = await read_blob("tests/ex1.jsonx");
    const tag = sha256(blob);
    console.log(tag);
    console.log(arrayBufferToHex(tag));
    console.log(js64encode(tag));
}

await test_sha256();


