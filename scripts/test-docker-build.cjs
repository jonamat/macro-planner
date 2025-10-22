#!/usr/bin/env node
const { spawnSync } = require('node:child_process');

if (process.env.CI && process.env.CI !== 'false') {
  console.log('Skipping Docker build test in CI environment.');
  process.exit(0);
}

const tag = process.env.DOCKER_TEST_TAG || 'macro-planner-docker-build-test';

console.log(`Running Docker build with tag "${tag}"...`);

const result = spawnSync(
  'docker',
  ['build', '-t', tag, '.'],
  {
    stdio: 'inherit',
    shell: false
  }
);

if (result.error) {
  console.error('Failed to execute docker build:', result.error.message);
  process.exit(result.status ?? 1);
}

if (result.status !== 0) {
  console.error(`Docker build exited with status ${result.status}.`);
  process.exit(result.status);
}

console.log('Docker build completed successfully.');
