import {
  getImports,
  flushImports,
  parseImport,
  analyzeImports,
  typeShake,
} from "../utils/mod.ts";

/*

this scope embeds the logic to process a dirty ts file:

  repairing normal and type imports as well as the typeof references in the file.

  eg:
  
    ```
    --- FROM ---
    import {Buffer} from 'foo';
    import type {Buffer} from 'foo';
    
    type bar = {
      data: Buffer;
    };

    --- TO ---
    import {Buffer} from 'foo';
    
    type bar = {
      data: typeof Buffer;
    };
    ```
*/
export function SwipeFile(file: Uint8Array): string[] {
  const fileData = new TextDecoder().decode(file);

  const imports = getImports(fileData);
  const _imports = imports.map((imp) => parseImport(imp));

  const lines = fileData.split("\n");

  // console.log("conflicting imports", conflictingImports);

  /*
  for (const conflict of conflictingImports) {
    lines = conflict.reduce((acc, _imp) => {
      if (_imp.import.type) {
        for (const symbol of _imp.import.symbols) {
          acc = typeShake(acc, symbol);
        }
      }

      return acc;
    }, lines);
  }
  */
  return flushImports(lines, imports, _imports);
}
