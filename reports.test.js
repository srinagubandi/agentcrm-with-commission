import test from 'node:test';
import { reportCatalog } from './report-catalog.js';
import { review } from './report-checks.js';
for (const report of reportCatalog) {
  for (const [step,feature] of report.capabilities.entries()) {
    test(report.id+' / '+feature,()=>review(report,step));
  }
}
