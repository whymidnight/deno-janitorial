export function typeShake(lines: string[], type: string): string[] {
  lines = lines.filter((line) => !line.startsWith("import"));

  for (const [idx, line] of lines.entries()) {
    if (line.includes(type)) {
      lines[idx] = line.replace(type, `typeof ${type}`);
      console.log(lines[idx], type);
    }
  }

  return lines;
}
