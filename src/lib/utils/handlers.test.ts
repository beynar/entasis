import { describe, expect, test, vi } from 'vitest';
import { composeHandlers } from './handlers.js';

describe('composeHandlers', () => {
	test("runs the consumer's handler first, then the built-in behaviour", () => {
		const calls: string[] = [];
		const handler = composeHandlers(
			() => calls.push('consumer'),
			() => calls.push('built-in')
		);
		handler(new Event('click', { cancelable: true }));
		expect(calls).toEqual(['consumer', 'built-in']);
	});

	test('preventDefault in the consumer handler skips the built-in behaviour', () => {
		const builtIn = vi.fn();
		const handler = composeHandlers((event: Event) => event.preventDefault(), builtIn);
		handler(new Event('click', { cancelable: true }));
		expect(builtIn).not.toHaveBeenCalled();
	});

	test('either side may be missing', () => {
		const builtIn = vi.fn();
		composeHandlers(undefined, builtIn)(new Event('click'));
		expect(builtIn).toHaveBeenCalledOnce();
		expect(() => composeHandlers(vi.fn(), null)(new Event('click'))).not.toThrow();
	});
});
