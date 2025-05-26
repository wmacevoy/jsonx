# JSONX: Extended JSON for Configuration and Data

JSONX is a lightweight, declarative configuration language built as a superset of JSON.
---

## Key Features

* **JSON-compatible**: Valid JSON is valid JSONX; comments (`#`, `//`, and nested `/*` ... `*/`) and trailing commas are allowed.

* **DRY**:
```javascript
{
  api : { 
    url: `https://api.com/v${..version.string}`,
   },
  version : {
    major: 1, minor: 2, revision: 3, 
    string : `${.major}.${.minor}.${.revision}`,
  },
}
```
Don't-repeat-yourself! This reduces copy-paste errors and merge conflicts. 

* **Lambdas**:
```javascript
{
  api: endpoint => `https://example.com/v1/${endpoint}`,
  login: .api(login),
  users: .api(users),
}
```
Lambda's give you a little more DRY.

The root context `.*` has some handy lambdas:

 * `use` include some context in another.
 * `read_blob` read a file as a binary blob.
 * `read_utf8` read a utf8-encoded file as a string.
 * `js64_encode` encode a blob as a a string using js64.
 * `js64_decode` decode a js64 string into a binary blob.
 * `sha256_hash` compute 32 byte binary blob hash of binary blob input.
 * `sha256_encrypt` encrypt using sha256-ctr mode.
 * `sha256_decrypt` decrypt using sha256-ctr mode.

* **Key-friendly**
```javascript
{
  decrypt: cipher => 
    .*utf8_decode
    .*sha256_decrypt
    .*js64_decode
    .cipher,
  
  encrypt: plain => 
    .*js64_encode
    .*sha256_encrypt
    .*utf8_encode
    .plain,

  key: .decrypt $sjnvh8493hiunvjkvnrjk,
  encrypt_key: .encrypt read_utf8(`${getenv(HOME)}/.'private/key.dat'),
}
```
Your encrypted keys can be in version control. 

* **Binary Blobs**:
```javascript
{
  favicon: .*read 'favicon.ico',
}
```

* ** Use defaults? and imperatives!**:
```javascript
{
  .*use? 'default.jsonx', /* weaker */
  .*use! 'imperative.jsonx', /* stronger */
}
```
? weakens an assignment. ! strengthens.  Last strongest assignment wins.

* **Arbitrary-precision integers**: 
{
  .factorial: 
    k => 1 if .k <= 1 
         else .k*(..factorial (.k-1)),
  cards: 52,
  decks: .factorial .cards,
}

* **Lazy Sandbox**:
Evaluates only parts required, so unused configuration can be missing. Evaluation can be computationally bounded so configuration from untrusted sources can be safely done.

```javascript
{
  configuration: {
    type: .*getenv CONFIGURATION,
    testing: .type == testing,
    release: .type == release,
    ok: .testing || .release
  },

  db : {
     keys {
       testing: .*utf8 .*decrypt { 
         blob: .*js64 $ksks, 
         key: .*js64 .*getenv TEST_MAIN_KEY,
       },
       release: .*utf8 .*decrypt {
         blob: .*js64 $uuvm,
         key: .*js64 .*getenv RELEASE_MAIN_KEY,
       },
     },
     key: .keys[..configuration.type],
  }
}
```
If you only ask for jx.key - you will only need the 
---

## Syntax Overview

```javascript
{
  // Merge in defaults from another file
  include("defaults.jx"),

  // Environment and overrides
  port: getenv("PORT") || 8080,
  secret: sha256_decrypt(include("secret.b64")),

  // Binary blobs
  logo: b64'R0lGODlhAQABAIAAAAUEBA==' ,  // tiny GIF

  // Relative refs
  nested: {
    a: .port + 1,    // refers to `port` in this object
    b: ..port + 2,   // refers to `port` in parent object
    c: ...port + 3   // grandparent
  },

  // Template strings
  url: `http://${.host}:${.port}/api`,

  // Lambdas & computation
  double: (v) => v * 2,
  result: .double(21),

  // Lists with merge
  items: [1,2,3, include("more.jx")],

  // BigInt and floats
  max: 9007199254740991n,
  ratio: 1.23e-4,
}
```

### Function-based Merge

Instead of `...` spread, simply call `include(path)` in object position:

```jx
{
  include("base.jx"),  // merges fields from base.jx
  debug: true,
}
```

### Blob Literals

```jx
blob16: b16'48656c6c6f21',
blob64: b64'SGVsbG8h',
```

### Built-in Functions

| Function                | Description                                                |
| ----------------------- | ---------------------------------------------------------- |
| `include(path)`         | Load & merge another JSONX file (object)                   |
| `getenv(name)`          | Read environment variable (string or null)                 |
| `sha256(buffer)`        | Compute SHA-256 digest of a `Uint8Array` or binary blob    |
| `encrypt(buffer, key?)` | Encrypt binary `Uint8Array`; uses git-crypt key by default |
| `decrypt(buffer, key?)` | Decrypt binary `Uint8Array`; uses git-crypt key by default |
| `json(str)`             | Parse a JSON string into a JSONX value                     |
| `str(x)`                | Convert any value to a string                              |
| `utf8enc(str)`          | Encode JS string to UTF-8 bytes (`Uint8Array`)             |
| `utf8dec(buf)`          | Decode `Uint8Array` of UTF-8 bytes to JS string            |
| `b64enc(buf)`           | Base64-encode a binary `Uint8Array`                        |
| `b64dec(str)`           | Base64-decode to a `Uint8Array`                            |
| `b16enc(buf)`           | Hex-encode a binary `Uint8Array`                           |
| `b16dec(str)`           | Hex-decode to a `Uint8Array`                               |

### Relative References

* `.`   — current object
* `..`  — parent object
* `...` — grandparent object

```jx
{
  a: 10,
  child: { x: .a },       // 10
  grand: { inner: { y: ...a } }  // refers back to top-level `a`
}
```

---

## Implementation Notes

A typical QuickJS-based evaluator:

1. **Parse** JSON5-style syntax plus JSONX extensions into an AST.
2. **Evaluate** AST nodes with a context stack for relative refs and handle `include()` merges.
3. **Host bindings** provide native `getenv`, file I/O for `include`, crypto for `decrypt`, and text/encoding utilities.

---

## Examples

### Simple Service Config

```jx
{
  include("service.defaults.jx"),
  port: getenv("PORT") || 3000,
  url: `http://${.host}:${.port}`,
}
```

### Nested Inheritance

```jx
{
  include("base.jx"),
  nested: {
    value: .timeout,
    doubled: (.value * 2),
  }
}
```

### Secure Settings

```jx
{
  secret: decrypt(b64dec(getenv("SECRET_B64"))),
  config: json(include("config.json")),
}
```

---

## License

MIT – Free for any use.

JSONX is an extensible spec: adapt built-in functions to your runtime or host environment as needed.
