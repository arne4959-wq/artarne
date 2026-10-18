// tests/check.mjs — a minimal "check" collector (no test framework needed).
export function makeChecker(suite) {
  const failures = []; let passed = 0;
  const check = (name, ok, detail = '') => {
    if (ok) { passed++; console.log(`  ✓ ${name}`); }
    else { failures.push(`${suite}: ${name}${detail ? ' — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`); console.log(`  ✗ ${name}${detail ? '\n      ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`); }
  };
  return {check, failures, get passed() { return passed; }};
}
