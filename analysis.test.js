import test from 'node:test';
import {reportCatalog} from './report-catalog.js';
import {toolNames} from './analysis-tools.js';
import {checkCapability} from './analysis-checks.js';
for(const report of reportCatalog){
  for(const feature of toolNames){
    test(report.id+' / '+feature,()=>checkCapability(report,feature));
  }
}
