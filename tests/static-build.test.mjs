import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

test("la compilación estática contiene el juego y usa rutas relativas", async () => {
  const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
  assert.match(html, /LEGADO FC/);
  assert.match(html, /\.\/assets\//);
  assert.doesNotMatch(html, /src="\/assets\//);
});

test("el portal publica la capa multideporte y conserva el modo carrera", async () => {
  const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
  const asset = html.match(/src="\.\/assets\/(.+?\.js)"/)?.[1];
  assert.ok(asset);
  const js = await readFile(new URL(`../dist/assets/${asset}`, import.meta.url), "utf8");
  assert.match(js, /LEGADO FC/);
  assert.match(js, /v3\.football\.api-sports\.io/);
  assert.match(js, /v1\.basketball\.api-sports\.io/);
  assert.match(js, /v1\.formula-1\.api-sports\.io/);
  assert.match(js, /API-SPORTS/);
  assert.match(js, /x-apisports-key/);
  assert.match(js, /Todo el deporte/);
  assert.match(js, /Guardar y probar API mundial/);
  assert.match(js, /RESULTADOS DE LA FECHA/);
  assert.match(js, /No hay eventos en esta fecha/);
  assert.match(js, /requestedDate/);
  assert.match(js, /legado:prode/);
  assert.match(js, /Noche de campeones/);
});

test("la base inicial completa se publica con el juego", async () => {
  const seed = JSON.parse(await readFile(new URL("../dist/data/league-seed.json", import.meta.url), "utf8"));
  const leagues = Object.values(seed).flatMap((region) => Object.values(region));
  const clubs = leagues.flat();
  assert.equal(leagues.length, 26);
  assert.equal(clubs.length, 266);
  assert.equal(clubs.includes("Cerro Porteño"), true);
  assert.equal(clubs.includes("Real Madrid"), true);
  assert.equal((await stat(new URL("../dist/index.html", import.meta.url))).isFile(), true);
});
