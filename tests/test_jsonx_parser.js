#!./qjs.ape.exe --std --module
import * as std from 'std';
import { parseJSONX } from './jsonx_parser.js';

const quiet = false;

// Deep equality check
function equal(a, b) {
  if (a === b) return true;
  if (typeof a !== 'object' || a === null) return false;
  if (typeof b !== 'object' || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!equal(a[i], b[i])) return false;
    return true;
  }
  const ka = Object.keys(a).sort();
  const kb = Object.keys(b).sort();
  if (!equal(ka, kb)) return false;
  for (const k of ka) if (!equal(a[k], b[k])) return false;
  return true;
}

function assert(cond, msg) {
  if (!quiet) { std.err.puts(`assert ${msg} - ${cond}\n`) }
  if (!cond) {
    std.err.puts(`FAIL: ${msg}\n`);
    std.exit(1);
  }
}

function ok(name) {
  if (!quiet) { std.err.puts(`${name} ok\n`) }
}

// Tests
function test_number() {
  const ast = parseJSONX('123');
  assert(ast.type === 'NumberLiteral', 'NumberLiteral type');
  assert(ast.value === '123', 'NumberLiteral value');
  ok("number");
}

function test_string() {
  const ast = parseJSONX('"hello"');
  ok("string 1");
  assert(ast.type === 'StringLiteral', 'StringLiteral type');
  assert(ast.value === 'hello', 'StringLiteral value');
  ok("string");
}

function test_blob16() {
  const ast = parseJSONX("b16'deadbeef'");
  assert(ast.type === 'Blob16', 'Blob16 type');
  assert(ast.hex === 'deadbeef', 'Blob16 value');
  ok("blob16");
}

function test_blob64() {
  const ast = parseJSONX("b64'QUJD'");
  assert(ast.type === 'Blob64', 'Blob64 type');
  assert(ast.b64 === 'QUJD', 'Blob64 value');
}

function test_array() {
  const ast = parseJSONX('[1,2,3]');
  assert(ast.type === 'ArrayExpression', 'ArrayExpression type');
  assert(ast.elements.length === 3, 'ArrayExpression length');
  for (let i = 0; i < 3; i++) {
    assert(ast.elements[i].value === String(i + 1), `Array element ${i}`);
  }
}

function test_object_and_include() {
  const ast = parseJSONX('{ a:1, include(\"b.jx\"), c:\"hi\" }');
  assert(ast.type === 'ObjectExpression', 'ObjectExpression type');
  assert(ast.members.length === 3, 'ObjectExpression members');

  // member[0]
  assert(ast.members[0].key === 'a', 'member0 key');
  assert(ast.members[0].value.value === '1', 'member0 value');

  // member[1]
  const spread = ast.members[1].spread;
  assert(spread.type === 'CallExpression', 'spread call type');
  assert(spread.callee.name === 'include', 'spread call name');
  assert(spread.arguments[0].value === 'b.jx', 'spread arg');

  // member[2]
  assert(ast.members[2].key === 'c', 'member2 key');
  assert(ast.members[2].value.value === 'hi', 'member2 value');
}

function test_binary_precedence() {
  const ast = parseJSONX('1+2*3');
  assert(ast.operator === '+', 'root operator');
  assert(ast.left.value === '1', 'left operand');
  assert(ast.right.operator === '*', 'right operator');
}

function test_lambda() {
  const ast = parseJSONX('(x,y)=>x+y');
  assert(ast.type === 'LambdaExpression', 'lambda type');
  assert(equal(ast.params, ['x','y']), 'lambda params');
  assert(ast.body.operator === '+', 'lambda body');
}

function test_comments_and_trailing() {
  const ast = parseJSONX(`{
    // comment
    a:1, /* block */
    b:2,
  }`);
  assert(ast.type === 'ObjectExpression', 'comments: object');
  assert(ast.members.length === 2, 'comments: members');
}

function main() {
  test_number();
  test_string();
  test_blob16();
  test_blob64();
  test_array();
  test_object_and_include();
  test_binary_precedence();
  test_lambda();
  test_comments_and_trailing();
  std.out.puts('✅ JSONX parser tests passed!\n');
  std.exit(0);
}

main();
