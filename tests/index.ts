// =====================================================================
// TradeMind AI - Automated Test Runner
// Runs technical indicators, market structure, risk calculator,
// trade planner, and AI schema validation test suites.
// =====================================================================

import { runTechnicalIndicatorTests } from './technicalIndicators.test';
import { runMarketStructureTests } from './marketStructure.test';
import { runRiskCalculatorTests } from './riskCalculator.test';
import { runTradePlannerTests } from './tradePlanner.test';
import { runAISchemaTests } from './aiResponseSchema.test';

export function runAllTests(): void {
  console.log('=====================================================');
  console.log('       TRADEMIND AI - AUTOMATED TEST SUITE          ');
  console.log('=====================================================');

  const start = Date.now();
  const results = [
    runTechnicalIndicatorTests(),
    runMarketStructureTests(),
    runRiskCalculatorTests(),
    runTradePlannerTests(),
    runAISchemaTests(),
  ];

  let totalPassed = 0;
  let totalFailed = 0;
  const allErrors: string[] = [];

  for (const r of results) {
    totalPassed += r.passed;
    totalFailed += r.failed;
    allErrors.push(...r.errors);
  }

  const duration = Date.now() - start;

  console.log('\n=====================================================');
  console.log(`TOTAL TESTS: ${totalPassed + totalFailed}`);
  console.log(`PASSED:      ${totalPassed}`);
  console.log(`FAILED:      ${totalFailed}`);
  console.log(`EXECUTION TIME: ${duration}ms`);
  console.log('=====================================================');

  if (totalFailed > 0) {
    console.error(`\nFailed tests:\n${allErrors.map((e) => `  - ${e}`).join('\n')}`);
    process.exit(1);
  } else {
    console.log('\nALL TRADEMIND AI UNIT & REGRESSION TESTS PASSED!');
  }
}

if (typeof require !== 'undefined' && require.main === module) {
  runAllTests();
}
