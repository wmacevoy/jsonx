# JSONX: Extended JSON for Configuration and Data

JSONX is a lightweight, declarative configuration language built as a superset of JSON. It empowers JSON with function-based merging, binary blobs, template strings, relative references, lambdas, and more—while remaining familiar and easy to use.

---

## Key Features

* **JSON-compatible**: Valid JSON is valid JSONX; comments and trailing commas are allowed.
* **Function-based merging**: `include(path)` pulls in and merges another JSONX object—no spread operator needed.
* **Blob literals**: `b16'…'` for hex, `b64'…'` for Base64 binary data.
* **Built-in functions**: `include()`, `getenv()`, `decrypt()`, `json()`, `str()`, `utf8enc()`, `utf8dec()`, `b64enc()`, `b64dec()`, `b16enc()`, `b16dec()`, `encode()`, `decode()`.
* **Template strings**: Backtick-quoted strings with `${…}` interpolation.
* **Relative references**:  `.` for current, `..` for parent, `...` for grandparent contexts.
* **Lambdas**: Inline functions `(x,y) => expr` for dynamic values.
* **Arbitrary-precision numbers**: BigInt (`n` suffix) and floats with exponent.

---

## Syntax Overview

```jx
{
  // Merge in defaults from another file
  include("defaults.jx"),

  // Environment and overrides
  port: getenv("PORT") || 8080,
  secret: decrypt(include("secret.b64")),

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
