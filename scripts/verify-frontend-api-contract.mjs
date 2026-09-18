#!/usr/bin/env node

/**
 * CI Guardrail:
 * 1. ZERO-MOCK ENFORCEMENT: Fails if any mock machinery (USE_MOCK, MOCK_*, mockData) exists in src/frontend/src.
 * 2. API CONTRACT VALIDATION: Extracts every api.(get|post|put|patch|delete) call in src/frontend/src/services
 *    and verifies it matches a documented path in docs/openapi.json.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let hasError = false;

// -----------------------------------------------------------------------------
// CHECK 1: ZERO-MOCK ENFORCEMENT
// -----------------------------------------------------------------------------
console.log('🔍 [1/2] Checking zero-mock policy in src/frontend/src...');
const srcDir = path.join(rootDir, 'src', 'frontend', 'src');

function getAllFiles(dir, exts = ['.js', '.jsx']) {
  let files = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (item.name !== 'node_modules') {
        files = files.concat(getAllFiles(fullPath, exts));
      }
    } else if (exts.includes(path.extname(item.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

const allFrontendFiles = getAllFiles(srcDir);
const mockPattern = /\b(USE_MOCK|MOCK_[A-Z0-9_]+|mockData)\b/g;
let mockViolations = [];

for (const file of allFrontendFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (mockPattern.test(line)) {
      mockViolations.push(`${path.relative(rootDir, file)}:${idx + 1}: ${line.trim()}`);
    }
  });
}

if (mockViolations.length > 0) {
  console.error('❌ ZERO-MOCK VIOLATIONS FOUND:');
  mockViolations.forEach((v) => console.error(`   ${v}`));
  hasError = true;
} else {
  console.log('✅ ZERO-MOCK PASS: 0 mock variables or mockData references found.');
}

// -----------------------------------------------------------------------------
// CHECK 2: API CONTRACT VERIFICATION
// -----------------------------------------------------------------------------
console.log('\n🔍 [2/2] Validating frontend service calls against docs/openapi.json...');
const openApiPath = path.join(rootDir, 'docs', 'openapi.json');
if (!fs.existsSync(openApiPath)) {
  console.error(`❌ docs/openapi.json not found at ${openApiPath}`);
  process.exit(1);
}

const openApi = JSON.parse(fs.readFileSync(openApiPath, 'utf8'));
const openApiPaths = Object.keys(openApi.paths || {});

const servicesDir = path.join(srcDir, 'services');
const serviceFiles = getAllFiles(servicesDir, ['.js']);

// Match api.get('/path'...), api.post(`/path/${id}`...)
const callRegex = /api\.(get|post|put|patch|delete)\s*\(\s*[`'"](\/[^`'"]*)[`'"]/g;
let apiCalls = [];

for (const file of serviceFiles) {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = callRegex.exec(content)) !== null) {
    const verb = match[1].toLowerCase();
    let rawPath = match[2];

    // Normalize `/api/v1` prefix
    const normalizedPrefix = rawPath.startsWith('/api/v1') ? rawPath : `/api/v1${rawPath}`;

    // Normalize template interpolation: /sessions/${id} -> /sessions/{id}
    const normalizedPath = normalizedPrefix
      .replace(/\$\{[^}]+\}/g, '{param}')
      .replace(/:[a-zA-Z0-9_]+/g, '{param}');

    apiCalls.push({
      file: path.relative(rootDir, file),
      verb,
      rawPath,
      normalizedPath,
    });
  }
}

// Function to check if a normalized client path matches any OpenAPI path pattern
function matchesOpenApiPath(clientPath, openApiCandidate) {
  const clientSegments = clientPath.split('/').filter(Boolean);
  const candidateSegments = openApiCandidate.split('/').filter(Boolean);

  if (clientSegments.length !== candidateSegments.length) return false;

  for (let i = 0; i < clientSegments.length; i++) {
    const c = clientSegments[i];
    const o = candidateSegments[i];

    if (o.startsWith('{') && o.endsWith('}')) {
      // OpenAPI param placeholder matches anything non-empty
      continue;
    }
    if (c === '{param}') {
      // Client placeholder matches anything
      continue;
    }
    if (c !== o) {
      return false;
    }
  }
  return true;
}

let contractErrors = [];
for (const call of apiCalls) {
  // Prioritize exact path match if present (e.g. /tutors/me over /tutors/{id})
  const matchedCandidate =
    openApiPaths.find((p) => p === call.normalizedPath) ||
    openApiPaths.find((p) => matchesOpenApiPath(call.normalizedPath, p) && Object.keys(openApi.paths[p] || {}).map(m => m.toLowerCase()).includes(call.verb)) ||
    openApiPaths.find((p) => matchesOpenApiPath(call.normalizedPath, p));
  if (!matchedCandidate) {
    contractErrors.push(`${call.file}: ${call.verb.toUpperCase()} ${call.rawPath} -> No matching route in openapi.json`);
  } else {
    // Check verb in openapi
    const methods = Object.keys(openApi.paths[matchedCandidate] || {}).map((m) => m.toLowerCase());
    if (!methods.includes(call.verb)) {
      contractErrors.push(`${call.file}: ${call.verb.toUpperCase()} ${call.rawPath} -> OpenAPI route exists but does not support ${call.verb.toUpperCase()} (allowed: ${methods.join(', ')})`);
    }
  }
}

if (contractErrors.length > 0) {
  console.error('❌ API CONTRACT MISMATCHES FOUND:');
  contractErrors.forEach((e) => console.error(`   ${e}`));
  hasError = true;
} else {
  console.log(`✅ API CONTRACT PASS: All ${apiCalls.length} frontend service API calls verified against openapi.json.`);
}

if (hasError) {
  process.exit(1);
} else {
  console.log('\n🎉 ALL FRONTEND CONTRACT & ZERO-MOCK CHECKS PASSED.');
  process.exit(0);
}
