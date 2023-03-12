export type IMPORT = {
  import: {
    type: boolean;
    named: boolean;
    symbols: string[];
  };
  from: string;
};

export function getImports(file: string): string[] {
  /*
  const a = [...file.matchAll(/import(.*?);/gs)].map((_i) =>
    console.log(_i[0])
  );
  console.log(a);
  */
  return [...file.matchAll(/import(.*?);/gs)].map((_imp) => _imp[0]);
}

export function parseImport(statement: string): IMPORT {
  statement = statement.split(";")[0];
  const statementStructure = statement.split("from");

  const from = [
    ...statementStructure[1].trim().match(/(["'])(.*?[^\\])\1/)!,
  ][2];

  const _import = (() => {
    let type = false;
    let named = false;
    let symbols: string[] = [];

    const importRegex = /import/g;
    const importTypeRegex = /import type/g;
    const importNamedRegex = /\{(.*)\}/;

    const isImporting = (stream: string) => stream.match(importRegex);
    const isImportingType = (stream: string) => stream.match(importTypeRegex);
    const isImportingNamed = (stream: string) => stream.match(importNamedRegex);

    const _importingType = isImportingType(statementStructure[0]);
    const _importing = isImporting(statementStructure[0]);

    if (_importingType) {
      type = true;
      const _importingNamed = _importingType
        ? isImportingNamed(
            statementStructure[0]
              .trim()
              .split([..._importingType][0])[1]
              .trim()
          )
        : null;
      if (_importingNamed) {
        named = true;
        symbols = [..._importingNamed][1].split(",");
      }
    } else if (_importing) {
      type = false;
      const _importingNamed = _importing
        ? isImportingNamed(
            statementStructure[0]
              .trim()
              .replaceAll("\n", "")
              .split([..._importing][0])[1]
              .trim()
          )
        : null;

      if (Deno.env.get("DEBUG"))
        console.log(
          from,
          _importing,
          statementStructure[0].trim().replaceAll("\n", "")
        );
      if (_importingNamed) {
        named = true;
        symbols = [..._importingNamed][1].split(",").map((imp) => imp.trim());
      } else {
        symbols = [statementStructure[0].split([..._importing][0])[0]];
      }
    }

    return {
      type,
      named,
      symbols,
    };
  })();

  return {
    import: _import,
    from,
  };
}

export function formatImport({ import: _import, from }: IMPORT): string {
  return `import ${_import.type ? "type " : ""}${
    _import.named
      ? "{" +
        (_import.symbols.length > 1
          ? "\n  " +
            _import.symbols.reduce((acc, _imp, idx) => {
              if (_imp === "") return acc;

              if (idx !== _import.symbols.length - 2) {
                acc += `${_imp},\n  `;
              } else {
                acc += `${_imp},\n`;
              }

              return acc;
            }, "")
          : _import.symbols.join(",")) +
        "}"
      : _import.symbols.join(",")
  } from "${from}";`;
}

export function analyzeImports(imports: IMPORT[]): {
  imports: IMPORT[];
  conflicting: IMPORT[][];
} {
  return {
    imports: imports.filter(
      (_imp) =>
        imports.filter(
          (__imp) =>
            __imp.from === _imp.from &&
            __imp.import.symbols.filter((__impSymbol) =>
              _imp.import.symbols.includes(__impSymbol)
            ).length
        ).length === 1 || !_imp.import.type
    ),
    conflicting: imports.reduce((acc, _imp) => {
      const dupes = imports.filter(
        (__imp) =>
          __imp.from === _imp.from &&
          __imp.import.type !== _imp.import.type &&
          __imp.import.symbols.filter((__impSymbol) =>
            _imp.import.symbols.includes(__impSymbol)
          )
      );
      if (
        dupes.length &&
        !acc.filter(
          (_acc) => !_acc.filter((__imp) => __imp.from !== _imp.from).length
        ).length
      )
        acc.push([_imp, ...dupes]);

      return acc;
    }, [] as IMPORT[][]),
  };
}

export function flushImports(
  lines: string[],
  ogImports: string[],
  parsedImports: IMPORT[]
): string[] {
  const { imports: analyzedImports } = analyzeImports(parsedImports);

  if (Deno.env.get("DEBUG")) console.log(ogImports);
  lines = lines.filter(
    (line) => !ogImports.flatMap((_imp) => _imp.split("\n")).includes(line)
  );

  for (const imp of analyzedImports.reverse()) {
    lines.unshift(formatImport(imp));
  }

  return lines;
}
