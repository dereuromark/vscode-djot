import * as path from 'node:path';

/**
 * Pure, dependency-free helpers for the djot-php CLI integration.
 * Kept separate from extension.ts so they can be unit tested without the vscode API.
 */

/**
 * Build the argument list for `djot convert` based on the configured safe mode.
 */
export function buildConvertArgs(safeMode: string): string[] {
  const args = ['convert', '-', '--format=html'];
  if (safeMode === 'default') {
    args.push('--safe');
  } else if (safeMode === 'strict') {
    args.push('--safe=strict');
  }
  return args;
}

/**
 * Find the djot CLI under any of the given roots (`<root>/vendor/bin/djot`).
 * `exists` is injected so this stays pure and testable.
 */
export function findCliInRoots(roots: string[], exists: (p: string) => boolean): string | undefined {
  for (const root of roots) {
    const candidate = path.join(root, 'vendor', 'bin', 'djot');
    if (exists(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

/**
 * Escape text for safe inclusion in HTML.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
