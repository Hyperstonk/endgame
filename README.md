# Endgame

## Package creation

If you want your new package `@endgame/[insert-name]` to work you'll need to create a directory inside the `packages` folder.

Then init a `package.json` inside it and change some things (see belows).

```json
{
  "name": "@endgame/[insert-name-here]",
  "version": "0.0.0",
  "description": "Add a description",
  "repository": "MBDW-Studio/endgame",
  "author": "Alphability <albanmezino@gmail.com> (https://albanmezino.com)",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist/*.js", "dist/*.js.map", "dist/*.d.ts"],
  "scripts": {
    "watch": "tsc -w",
    "test": "jest __tests__ --collectCoverage --runInBand",
    "test:watch": "jest __tests__ --watchAll --runInBand"
  },
  "devDependencies": {},
  "dependencies": {},
  "publishConfig": {
    "access": "restricted"
  },
  "license": "MIT"
}
```
