#!/usr/bin/env qjs --module
// jsonx_parser.js — Recursive-descent JSONX parser for QuickJS
// Usage: import { parseJSONX } from './jsonx_parser.js';

'use strict';

class Tokenizer {
  constructor(src) {
    this.src = src;
    this.pos = 0;
  }
  

}

function tokenize(src) {

}
// Tokenizer: converts source string into token list
function tokenize(src) {

  const tokens = [];
  const re = /([ \t\r\n]+)|\/\/.*|\/\*[\s\S]*?\*\/|(...|\.\.\.|\.\.|\.|\{|\}|\[|\]|\(|\)|:|=>|\+\+|--|\+|-|\*|\/|%|==|!=|===|!==|<=|<|>=|>|&&|\|\||!|[A-Za-z_$][A-Za-z0-9_$]*|b16'([0-9A-Fa-f]+)'|b64'([A-Za-z0-9+/=]+)'|`(?:\\.|\$\{|\}|[^`])*`|'(?:\\.|[^'])*'|"(?:\\.|[^"])*"|[0-9]+(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?n?)/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    if (m[1] || m[0].startsWith('//') || m[0].startsWith('/*')) {
      continue; // skip whitespace/comments
    }
    const tk = m[0];
    tokens.push({tok: tk});
  }
  tokens.push({tok: 'EOF'});
  std.err.puts(`src: ${src} tokens: ${JSON.stringify(tokens)}`);
  return tokens;
}

// AST node factories
const AST = {
  number: v => ({type:'NumberLiteral', value:v}),
  string: v => ({type:'StringLiteral', value:v}),
  blob16: v => ({type:'Blob16', hex:v}),
  blob64: v => ({type:'Blob64', b64:v}),
  bool: v => ({type:'BooleanLiteral', value:v}),
  null:  () => ({type:'NullLiteral'}),
  ident: v => ({type:'Identifier', name:v}),
  relref: (dots,name) => ({type:'RelativeRef', level:dots.length-1, name}),
  obj: members=>({type:'ObjectExpression', members}),
  arr: items=>({type:'ArrayExpression', elements:items}),
  call: (name,args)=>({type:'CallExpression', callee:name, arguments:args}),
  lambda: (params,body)=>({type:'LambdaExpression', params, body}),
  binary: (op,left,right)=>({type:'BinaryExpression', operator:op, left, right}),
  unary: (op,arg)=>({type:'UnaryExpression', operator:op, argument:arg}),
};

class UTF8 {
  constructor(bytes,begin=null,end=null) {
    this.bytes = bytes;
    this.begin = begin == null ? 0 : int(begin);
    this.end = end == null ? bytes.length : int(end);
    this.char = 0;
    this.reset();
  }

  reset() {
    this.at = this.begin;
    while (this.at < this.end && ((this.bytes[at] & 0x80) != 0 ) {
      ++this.at;
    }
    this.char = this.utf8();
  }

  start() { return this.at == this.begin; }
  end() { return this.at >= this.end; }

  reject() {
    if (this.at <= this.begin) return;
    --this.at;
    while (this.at >= this.begin && ((this.bytes[at] & 0x80) != 0 ) {
      --this.at;
    }
  }

  accept() {
    if (this.at >= this.end) return;
    ++this.at;
    while (this.at < this.end && ((this.bytes[at] & 0x80) != 0 ) {
      ++this.at;
    }
  }
}

// LL(1) Parser with operator precedence
class Parser {
  constructor(bytes) {
    this.scanner = new UTF8(bytes);
    this.stack = [];
  }
  char() { return self.utf8.char; }
  single_quote_char() {
  }
  single_quoted_string(quote) {
    accept();
  }
  string() {
    const ch = this.char();
    if (ch == "'" || ch == "\"") {
      return this.quoted_string(ch);
    }
    if (ch == "`") {
      return this.interpolated_string(ch);
    }
    return null;
  }

  peek() { return this.pos < this.str.length this.str[pos]}
  peek() { return this.tokens[this.pos].tok; }
  next() { return this.tokens[this.pos++].tok; }
  expect(t) { const tk=this.next(); if (tk!==t) throw new SyntaxError(`Expected ${t} but got ${tk}`); }

  parseJSONX() {
    const expr = this.parseExpression();
    if (this.peek() !== 'EOF') throw new SyntaxError('Unexpected token '+this.peek());
    return expr;
  }

  // Expression parsing with precedence
  parseExpression(pre=0) {
    let left = this.parsePrimary();
    while (true) {
      const op = this.peek();
      const prec = Parser.PRECEDENCE[op];
      if (!prec || prec < pre) break;
      this.next();
      const right = this.parseExpression(prec+ (Parser.RIGHT_ASSOC[op]?0:1));
      left = AST.binary(op,left,right);
    }
    return left;
  }

  parsePrimary() {
    const tk = this.peek();
    // literals
    if (/^[0-9]/.test(tk)) {
      this.next();
      return AST.number(tk);
    }
    if (tk === 'true' || tk === 'false') {
      this.next(); return AST.bool(tk==='true');
    }
    if (tk === 'null') {
      this.next(); return AST.null();
    }
    if (tk.startsWith("b16'")) {
      this.next(); return AST.blob16(tk.slice(3,-1));
    }
    if (tk.startsWith("b64'")) {
      this.next(); return AST.blob64(tk.slice(4,-1));
    }
    if (tk[0]==='"'||tk[0]==='\''||tk[0]==='`') {
      this.next();
      const str = tk.slice(1,-1);
      return AST.string(str);
    }
    // punctuation
    if (tk==='(') {
      this.next();
      // check for lambda params
      let params=[], first=true;
      while (this.peek()!==')') {
        if (!first) this.expect(',');
        params.push(this.next()); first=false;
      }
      this.expect(')');
      if (this.peek()==='=>') {
        this.next();
        const body = this.parseExpression();
        return AST.lambda(params, body);
      }
      // else fall back to parenthesized
      const expr = AST.ident('(');
      // not supporting grouping for brevity
      return expr;
    }
    if (tk==='[') {
      this.next(); const arr=[];
      if (this.peek()!==']') {
        do { arr.push(this.parseExpression()); } while (this.peek()==',' && this.next());
      }
      this.expect(']');
      return AST.arr(arr);
    }
    if (tk==='{') {
      this.next(); const members=[];
      if (this.peek()!=='}') {
        do {
          // either include() in object pos or key:value
          if (/^[A-Za-z_$]/.test(this.peek())) {
            const name = this.next();
            if (this.peek()==='(') {
              // include() call
              const call = this.parseCall(name);
              members.push({spread:call});
            } else {
              this.expect(':');
              const val = this.parseExpression();
              members.push({key:name,value:val});
            }
          } else if (this.peek()==='include') {
            const call = this.parseExpression();
            members.push({spread:call});
          } else {
            throw new SyntaxError('Invalid object member: '+this.peek());
          }
        } while (this.peek()==',' && this.next());
      }
      this.expect('}');
      return AST.obj(members);
    }
    // identifier, relative ref, or call
    if (/^[A-Za-z_$\.]/.test(tk)) {
      // relative ref
      if (tk.startsWith('.')) {
        const dots = tk.match(/\./g);
        const name = ''; // skip; not implemented in tokenizer
      }
      // identifier or call
      const id = this.next();
      if (this.peek()==='(') {
        return this.parseCall(id);
      }
      return AST.ident(id);
    }
    // unary
    if (tk==='-'||tk==='!') {
      const op=this.next();
      const arg=this.parseExpression(Parser.PRECEDENCE[op]);
      return AST.unary(op,arg);
    }
    throw new SyntaxError('Unexpected token '+tk);
  }

  parseCall(name) {
    this.expect('(');
    const args=[];
    if (this.peek()!==')') {
      do { args.push(this.parseExpression()); } while (this.peek()==',' && this.next());
    }
    this.expect(')');
    return AST.call(AST.ident(name), args);
  }
}

// Operator precedence table
Parser.PRECEDENCE = {
  '||':1, '&&':2,
  '==':3,'!=':3,'===':3,'!==':3,
  '<':4,'<=':4,'>':4,'>=':4,
  '+':5,'-':5,
  '*':6,'/':6,'%':6,
};
Parser.RIGHT_ASSOC = {'=':true, '=>':true};

/**
 * Parse a JSONX string into an AST.
 * @param {string} text
 * @returns {object} AST node
 */
function parseJSONX(text) {
  const tokens = tokenize(text);
  const p = new Parser(tokens);
  return p.parseJSONX();
}

export { parseJSONX };
