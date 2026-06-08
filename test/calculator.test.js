import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleProject } from '../public/sample-data.js';
import { calculateProject } from '../public/calculator.js';

function closeTo(actual, expected, tolerance = 0.01) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} was not close to ${expected}`);
}

test('matches the Emler Excel workbook total', () => {
  const result = calculateProject(sampleProject);
  closeTo(result.angebot.gesamtNetto, 47920.0078651734);
});
