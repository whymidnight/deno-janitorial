#!/usr/bin/env -S deno run --allow-all

import { readAll } from "https://deno.land/std@0.179.0/streams/read_all.ts";
import * as flags from "https://deno.land/std@0.179.0/flags/mod.ts";
import { SwipeFile } from "./mod.ts";

export function add(a: number, b: number): number {
  return a + b;
}

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
async function Swipe(filePath: string) {
  const file = await Deno.open(filePath, {
    read: true,
    write: true,
  });
  const fileData = await readAll(file);
  file.close();

  await Deno.writeTextFile(filePath, SwipeFile(fileData).join("\n"));
}

if (import.meta.main) {
  const args = flags.parse(Deno.args);

  switch (args["action"]) {
    case "swipe": {
      await Swipe(args["file"]);
      break;
    }
  }
}
