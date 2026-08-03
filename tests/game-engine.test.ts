import test from "node:test";
import assert from "node:assert/strict";
import { acceptOffer, createCareer, simulateSeason } from "../src/game/engine";
import { COUNTRIES } from "../src/game/data";

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
