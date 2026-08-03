import { mkdir, readFile, writeFile } from "node:fs/promises";

const source = await readFile(new URL("../src/game/data.ts", import.meta.url), "utf8");
const match = source.match(/export const LEAGUE_SEED[^=]*=\s*(\{[\s\S]*?\n\});\n\nexport const COUNTRIES/);
if (!match) throw new Error("No se pudo extraer LEAGUE_SEED");
const seed = Function(`"use strict"; return (${match[1]});`)();
await mkdir(new URL("../public/data/", import.meta.url), { recursive: true });
await writeFile(
  new URL("../public/data/league-seed.json", import.meta.url),
  `${JSON.stringify(seed, null, 2)}\n`,
);
console.log("Seed JSON generado correctamente.");
