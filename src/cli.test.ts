import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildConvertArgs, escapeHtml, findCliInRoots } from './cli';

test('buildConvertArgs: off mode adds no safe flag', () => {
  assert.deepEqual(buildConvertArgs('off'), ['convert', '-', '--format=html']);
});

test('buildConvertArgs: default mode adds --safe', () => {
  assert.deepEqual(buildConvertArgs('default'), ['convert', '-', '--format=html', '--safe']);
});

test('buildConvertArgs: strict mode adds --safe=strict', () => {
  assert.deepEqual(buildConvertArgs('strict'), ['convert', '-', '--format=html', '--safe=strict']);
});

test('findCliInRoots: returns first matching vendor/bin/djot', () => {
  const exists = (p: string) => p === '/b/vendor/bin/djot';
  assert.equal(findCliInRoots(['/a', '/b', '/c'], exists), '/b/vendor/bin/djot');
});

test('findCliInRoots: returns undefined when none exist', () => {
  assert.equal(findCliInRoots(['/a', '/b'], () => false), undefined);
});

test('escapeHtml: escapes the dangerous characters', () => {
  assert.equal(
    escapeHtml('<a href="x">&'),
    '&lt;a href=&quot;x&quot;&gt;&amp;',
  );
});
