1. Literal dependencies

```
process.env.DB_URL

config.PORT

"./utils/logger"
```

<hr>

2. Function Signature
- Instead of storing only `login` store
```
login(
email:string,
password:string
):Promise<User>
```

<hr>

3. Scope: for variable details
```
Global

Module

Function

Block
```
are needed for Variable Details.

<hr>

4. Symbol location
- not just `lineStart`  store
```
startLine

startColumn

endLine

endColumn
```
Later "Jump to source" becomes trivial.

<hr>

5. Documentation: Extract

```
/**
 * Creates a new user.
 */
```

This powers hover cards.