import { describe, expect, it, vi } from 'vitest';
import { createId } from './id.js';

describe('createId', () => {
	it('never returns an empty or very short id', () => {
		for (let index = 0; index < 1000; index += 1) {
			expect(createId().length).toBeGreaterThanOrEqual(8);
		}
	});

	it('stays unique across 10k calls', () => {
		const ids = new Set<string>();
		for (let index = 0; index < 10_000; index += 1) ids.add(createId());
		expect(ids.size).toBe(10_000);
	});

	it('honours the prefix', () => {
		const id = createId('toast');
		expect(id.startsWith('toast-')).toBe(true);
		expect(id.length).toBeGreaterThanOrEqual('toast-'.length + 8);
	});

	it('falls back to a long id when crypto.randomUUID is unavailable', () => {
		const original = globalThis.crypto;
		// The fallback must survive `Math.random()` returning a value whose base-36 form
		// has no fractional digits at all — the bug the old `substring(7)` ids had.
		const random = vi.spyOn(Math, 'random').mockReturnValue(0.5);
		Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true });
		try {
			const ids = new Set<string>();
			for (let index = 0; index < 100; index += 1) {
				const id = createId('x');
				expect(id.length).toBeGreaterThanOrEqual('x-'.length + 8);
				ids.add(id);
			}
			expect(ids.size).toBeGreaterThan(0);
		} finally {
			random.mockRestore();
			Object.defineProperty(globalThis, 'crypto', { value: original, configurable: true });
		}
	});
});
