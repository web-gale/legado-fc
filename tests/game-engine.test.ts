import test from "node:test";
import assert from "node:assert/strict";
import { acceptOffer, createCareer, nextLeagueAfterSeason, simulateSeason } from "../src/game/engine";
import { COUNTRIES } from "../src/game/data";
import { sportsDbTeamScore } from "../src/game/crests";

test("cada nacionalidad inicia libre y recibe una oferta de su país", () => {
  COUNTRIES.forEach((nationality, index) => {
    const career = createCareer({
      name: "Jugador de prueba",
      nationality,
      position: "MP",
      personality: "Profesional",
      difficulty: "Profesional",
    }, 1000 + index);
    assert.equal(career.club, "Agente libre");
    assert.equal(career.contractYears, 0);
    assert.equal(career.offers.length, 1);
    assert.equal(career.offers[0].league.startsWith(`${nationality} - `), true);
  });
});

test("la temporada queda bloqueada hasta aceptar el primer contrato", () => {
  const free = createCareer({
    name: "Álvaro Galeano",
    nationality: "Paraguay",
    position: "MP",
    personality: "Profesional",
    difficulty: "Profesional",
  }, 20260803);
  assert.deepEqual(simulateSeason(free), free);
  const signed = acceptOffer(free, free.offers[0]);
  assert.notEqual(signed.club, "Agente libre");
  assert.equal(signed.offers.length, 0);
  const advanced = simulateSeason(signed);
  assert.equal(advanced.season, 2);
  assert.equal(advanced.age, 15);
});

test("Fácil garantiza máxima participación, éxito y producción por posición", () => {
  const positions = ["POR", "DFC", "MC", "MP", "ED", "DC"] as const;
  positions.forEach((position, index) => {
    const free = createCareer({
      name: "Leyenda de prueba",
      nationality: "España",
      position,
      personality: "Profesional",
      difficulty: "Promesa",
    }, 7000 + index);
    const result = simulateSeason(acceptOffer(free, free.offers[0]));
    const season = result.history.at(-1)!;
    assert.ok(season.appearances > 42);
    assert.equal(
      season.appearances,
      (season.leagueMatches ?? 0) +
        (season.cupMatches ?? 0) +
        (season.internationalMatches ?? 0),
    );
    assert.equal(season.minutes, season.appearances * 90);
    assert.equal(season.injury, undefined);
    assert.ok(season.titles.length >= 1);
    assert.ok(season.awards.length >= 3);
    if (["MP", "ED", "DC"].includes(position)) {
      assert.ok(season.goals / season.appearances >= 0.9);
      assert.ok(season.assists / season.appearances >= 0.5);
    }
  });
});

test("Normal disputa al menos 80% del calendario total y alcanza sus mínimos", () => {
  const free = createCareer({
    name: "Profesional de prueba",
    nationality: "España",
    position: "DFC",
    personality: "Profesional",
    difficulty: "Profesional",
  }, 4555);
  const season = simulateSeason(acceptOffer(free, free.offers[0])).history.at(-1)!;
  const total =
    (season.leagueMatches ?? 0) +
    (season.cupMatches ?? 0) +
    (season.internationalMatches ?? 0);
  assert.ok((season.cupMatches ?? 0) > 0);
  assert.ok(season.appearances >= Math.ceil(total * 0.8));
  assert.ok(season.goals / season.appearances >= 0.58);
  assert.ok(season.assists / season.appearances >= 0.2);
});

test("el campeón de segunda asciende y conserva el club", () => {
  const free = createCareer({
    name: "Capitán del ascenso",
    nationality: "España",
    position: "MP",
    personality: "Líder",
    difficulty: "Promesa",
  }, 9201);
  const signed = acceptOffer(free, free.offers[0]);
  const result = simulateSeason(signed);
  assert.equal(result.club, signed.club);
  assert.equal(result.league, "España - LaLiga");
  assert.equal(result.history.at(-1)?.leagueMovement, "Ascenso");
  assert.equal(result.history.at(-1)?.nextLeague, "España - LaLiga");
});

test("las reglas de ascenso y descenso enlazan ambas divisiones", () => {
  assert.equal(
    nextLeagueAfterSeason("Inglaterra - EFL Championship (2ª)", true, false),
    "Inglaterra - Premier League",
  );
  assert.equal(
    nextLeagueAfterSeason("Brasil - Brasileirão (Série A)", false, true),
    "Brasil - Série B (2ª)",
  );
});

test("el resolvedor de escudos rechaza clubes homónimos de otro país", () => {
  const paraguayan = sportsDbTeamScore("Nacional", "Paraguay", {
    strTeam: "Club Nacional",
    strSport: "Soccer",
    strCountry: "Paraguay",
    strBadge: "https://example.test/nacional-paraguay.png",
  });
  const uruguayan = sportsDbTeamScore("Nacional", "Paraguay", {
    strTeam: "Club Nacional de Football",
    strSport: "Soccer",
    strCountry: "Uruguay",
    strBadge: "https://example.test/nacional-uruguay.png",
  });
  assert.ok(paraguayan > uruguayan);
  assert.ok(paraguayan >= 70);
  assert.ok(uruguayan < 70);
});

test("Fácil varía goles y asistencias entre temporadas sin usar cifras fijas", () => {
  const totals = new Set<string>();
  for (let seed = 8100; seed < 8112; seed++) {
    const free = createCareer({
      name: "Goleador variable",
      nationality: "España",
      position: "DC",
      personality: "Profesional",
      difficulty: "Promesa",
    }, seed);
    const season = simulateSeason(acceptOffer(free, free.offers[0])).history.at(-1)!;
    totals.add(`${season.goals}-${season.assists}`);
    assert.ok(season.goals / season.appearances >= 0.9);
    assert.ok(season.assists / season.appearances >= 0.5);
  }
  assert.ok(totals.size >= 5);
});

test("los títulos de temporada usan nombres reales de las competiciones", () => {
  const free = createCareer({
    name: "Campeón de prueba",
    nationality: "España",
    position: "MP",
    personality: "Profesional",
    difficulty: "Promesa",
  }, 9201);
  const season = simulateSeason(acceptOffer(free, free.offers[0])).history.at(-1)!;
  assert.ok(season.titles.includes("LaLiga Hypermotion"));
  assert.equal(season.titles.includes("Liga nacional"), false);
  assert.equal(season.titles.includes("Copa nacional"), false);
});
