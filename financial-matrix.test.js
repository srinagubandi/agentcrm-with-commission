import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { families, financialScenario } from './financial-scenarios.js';

const log = gunzipSync(readFileSync(new URL('./slice-log-401-10401.jsonl.gz', import.meta.url))).toString('utf8')
  .trimEnd().split('\n').map(line => JSON.parse(line));
assert.equal(log.length,10001);
const seen = new Set();
for (const [index, family] of families.entries()) {
  for (let variant = 0; variant < 1111; variant++) {
    const offset = 2 + index * 1111 + variant;
    test(`slice ${401 + offset} | ${family} | case ${variant + 1}`, () => {
      const evidence = financialScenario(index, variant);
      const key = JSON.stringify([family,evidence.inputs]);
      assert.equal(seen.has(key),false,'Duplicate financial inputs');
      seen.add(key);
      assert.equal(log[offset].slice,401 + offset);
      assert.deepEqual(log[offset].evidence,evidence);
    });
  }
}
