import { flushSync } from 'svelte';
import { describe, expect, test } from 'vitest';
import { useUndoStack, type UndoStackSignature } from './useUndoStack.svelte.js';

type Entry = { id: string; before?: string; after?: string };

const signatureOf = (entry: Entry): UndoStackSignature => ({
	before: entry.before ?? '',
	after: entry.after ?? ''
});

describe('useUndoStack', () => {
	test('push appends, clears the redo stack and bumps the revision', () => {
		const stack = useUndoStack<Entry>({ limit: () => 50 });
		const first = { id: 'first' };
		stack.push(first);
		stack.undo();
		expect(stack.future).toEqual([first]);
		const revision = stack.revision;

		stack.push({ id: 'second' });

		expect(stack.past.map((entry) => entry.id)).toEqual(['second']);
		expect(stack.future).toEqual([]);
		expect(stack.revision).toBeGreaterThan(revision);
	});

	test('undo and redo move the newest entry between the stacks', () => {
		const stack = useUndoStack<Entry>({ limit: () => 50 });
		stack.push({ id: 'first' });
		stack.push({ id: 'second' });

		stack.undo();
		expect(stack.peekPast()?.id).toBe('first');
		expect(stack.peekFuture()?.id).toBe('second');

		stack.redo();
		expect(stack.peekPast()?.id).toBe('second');
		expect(stack.peekFuture()).toBeUndefined();
	});

	test('undo and redo are no-ops on an empty stack', () => {
		const stack = useUndoStack<Entry>({ limit: () => 50 });
		stack.undo();
		stack.redo();
		expect(stack.past).toEqual([]);
		expect(stack.future).toEqual([]);
	});

	test('the limit trims the oldest entries and is re-read on every push', () => {
		let limit = 2;
		const stack = useUndoStack<Entry>({ limit: () => limit });
		stack.push({ id: 'first' });
		stack.push({ id: 'second' });
		stack.push({ id: 'third' });
		expect(stack.past.map((entry) => entry.id)).toEqual(['second', 'third']);

		limit = 1;
		stack.push({ id: 'fourth' });
		expect(stack.past.map((entry) => entry.id)).toEqual(['fourth']);
	});

	test('remove drops the entry and leaves the redo stack alone', () => {
		const stack = useUndoStack<Entry>({ limit: () => 50 });
		const first = { id: 'first' };
		const second = { id: 'second' };
		stack.push(first);
		stack.push(second);
		stack.undo();

		stack.remove(first);

		expect(stack.past).toEqual([]);
		expect(stack.future).toEqual([second]);
	});

	test('remove ignores an entry that is no longer stacked', () => {
		const stack = useUndoStack<Entry>({ limit: () => 50 });
		const first = { id: 'first' };
		stack.push(first);
		const revision = stack.revision;

		stack.remove({ id: 'other' });

		expect(stack.past).toEqual([first]);
		expect(stack.revision).toBe(revision);
	});

	test('signatureOf drops the past when an entry does not continue the chain', () => {
		const stack = useUndoStack<Entry>({ limit: () => 50, signatureOf });
		stack.push({ id: 'first', before: 'a', after: 'b' });
		stack.push({ id: 'second', before: 'b', after: 'c' });
		expect(stack.past).toHaveLength(2);

		stack.push({ id: 'third', before: 'outside', after: 'd' });

		expect(stack.past.map((entry) => entry.id)).toEqual(['third']);
	});

	test('without signatureOf every push is appended', () => {
		const stack = useUndoStack<Entry>({ limit: () => 50 });
		stack.push({ id: 'first', before: 'a', after: 'b' });
		stack.push({ id: 'second', before: 'outside', after: 'd' });
		expect(stack.past).toHaveLength(2);
	});

	test('touch re-runs readers without changing the stacks', () => {
		const stack = useUndoStack<Entry>({ limit: () => 50 });
		const entry = { id: 'first' };
		stack.push(entry);
		const seen: Array<string | undefined> = [];
		const stop = $effect.root(() => {
			$effect(() => {
				seen.push(stack.peekPast()?.id);
			});
		});
		flushSync();
		expect(seen).toEqual(['first']);

		entry.id = 'renamed';
		stack.touch();
		flushSync();

		expect(seen).toEqual(['first', 'renamed']);
		expect(stack.past).toEqual([entry]);
		stop();
	});

	test('clearPast and clearFuture empty one stack each', () => {
		const stack = useUndoStack<Entry>({ limit: () => 50 });
		stack.push({ id: 'first' });
		stack.push({ id: 'second' });
		stack.undo();

		stack.clearPast();
		expect(stack.past).toEqual([]);
		expect(stack.future).toHaveLength(1);

		stack.clearFuture();
		expect(stack.future).toEqual([]);
	});
});
