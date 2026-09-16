import { afterEach, describe, expect, test, vi } from 'vitest';
import {
	clampRovingKey,
	createRovingRestoreVersion,
	useRovingRegistry
} from './useRovingRegistry.svelte.js';

const flush = () => new Promise<void>((resolve) => queueMicrotask(() => resolve()));

const node = (id: string) => {
	const element = document.createElement('button');
	element.dataset.id = id;
	document.body.append(element);
	return element;
};

afterEach(() => {
	document.body.innerHTML = '';
});

describe('useRovingRegistry', () => {
	test('hands back the node registered for a key', () => {
		const registry = useRovingRegistry<string>({ restoreTarget: (key) => key });
		const first = node('a');

		const release = registry.register('a', first);
		expect(registry.get('a')).toBe(first);
		expect(registry.has('a')).toBe(true);

		release();
		expect(registry.get('a')).toBeUndefined();
		expect(registry.has('a')).toBe(false);
	});

	test('keeps the replacement when the node it renders over releases late', () => {
		const registry = useRovingRegistry<string>({ restoreTarget: (key) => key });
		const first = node('a');
		const second = node('a-again');

		const releaseFirst = registry.register('a', first);
		registry.register('a', second);
		expect(registry.get('a')).toBe(second);

		releaseFirst();
		expect(registry.get('a')).toBe(second);
	});

	test('restores focus onto the first of several nodes sharing a key', async () => {
		const registry = useRovingRegistry<string>({ multiple: true, restoreTarget: (key) => key });
		const first = node('a');
		const second = node('a-too');
		registry.register('a', first);
		registry.register('a', second);

		registry.schedule('a');
		await flush();

		expect(document.activeElement).toBe(first);
	});

	test('resolves the restore target when the restore flushes, not when it is scheduled', async () => {
		let pending = 'a';
		const registry = useRovingRegistry<string>({ restoreTarget: () => pending });
		const first = node('a');
		const second = node('b');
		registry.register('a', first);
		registry.register('b', second);

		registry.schedule();
		pending = 'b';
		await flush();

		expect(document.activeElement).toBe(second);
	});

	test('abandons a restore whose target went away', async () => {
		const registry = useRovingRegistry<string>({ restoreTarget: () => null });
		registry.register('a', node('a'));

		registry.schedule('a');
		await flush();

		expect(document.activeElement).toBe(document.body);
	});

	test('lets a later restore in the same domain supersede the pending one', async () => {
		const version = createRovingRestoreVersion();
		const days = useRovingRegistry<string>({ version, restoreTarget: (key) => key });
		const slots = useRovingRegistry<string>({ version, restoreTarget: (key) => key });
		const day = node('day');
		const slot = node('slot');
		days.register('day', day);
		slots.register('slot', slot);

		days.schedule('day');
		slots.schedule('slot');
		await flush();

		expect(document.activeElement).toBe(slot);
	});

	test('records the restored key before focus moves', async () => {
		const onRestore = vi.fn(() => expect(document.activeElement).toBe(document.body));
		const registry = useRovingRegistry<string>({ restoreTarget: (key) => key, onRestore });
		const first = node('a');
		registry.register('a', first);

		registry.schedule('a');
		await flush();

		expect(onRestore).toHaveBeenCalledWith('a');
		expect(document.activeElement).toBe(first);
	});

	test('releases only the node that still owns focus', () => {
		const onRelease = vi.fn();
		const registry = useRovingRegistry<string>({
			restoreTarget: (key) => key,
			releaseWhen: 'focused',
			onRelease
		});
		const first = node('a');
		const second = node('b');
		const releaseFirst = registry.register('a', first);
		const releaseSecond = registry.register('b', second);

		second.focus();
		releaseFirst();
		expect(onRelease).not.toHaveBeenCalled();

		releaseSecond();
		expect(onRelease).toHaveBeenCalledWith('b');
	});

	test('clears every registration at once', () => {
		const registry = useRovingRegistry<string>({ restoreTarget: (key) => key });
		registry.register('a', node('a'));
		registry.register('b', node('b'));

		registry.clear();

		expect(registry.has('a')).toBe(false);
		expect(registry.has('b')).toBe(false);
	});
});

describe('clampRovingKey', () => {
	test('keeps the index the removed key held', () => {
		expect(clampRovingKey(['a', 'b', 'c'], 'b', ['a', 'c', 'd'])).toBe('c');
	});

	test('clamps past the end of a shorter list', () => {
		expect(clampRovingKey(['a', 'b', 'c'], 'c', ['a', 'b'])).toBe('b');
	});

	test('falls back to the first key when the removed one is unknown', () => {
		expect(clampRovingKey(['a', 'b'], 'gone', ['x', 'y'])).toBe('x');
	});

	test('has nothing to hand back for an empty list', () => {
		expect(clampRovingKey(['a'], 'a', [])).toBeUndefined();
	});
});
