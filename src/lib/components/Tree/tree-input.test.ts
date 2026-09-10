import type { FileTreeDropContext } from '@pierre/trees';
import { describe, expect, test, vi } from 'vitest';
import { createTreeOptions } from './tree-input.js';

describe('Tree public adapter contract', () => {
	test('maps semantic density and keeps raw options available at the adapter boundary', () => {
		for (const [density, preset] of [
			['small', 'compact'],
			['normal', 'default'],
			['large', 'relaxed']
		] as const) {
			expect(createTreeOptions({ paths: [] }, { density: 0.5 }, { density }).density).toBe(preset);
		}
		expect(createTreeOptions({ paths: [] }, { density: 0.5 }).density).toBe(0.5);
	});

	test('reports one named drop failure while preserving the native adapter callback', () => {
		const onDropError = vi.fn();
		const adapterCallback = vi.fn();
		const options = createTreeOptions(
			{ paths: ['readme.md'] },
			{ dragAndDrop: { onDropError: adapterCallback } },
			undefined,
			{ onDropError }
		);
		const event: FileTreeDropContext = {
			draggedPaths: ['readme.md'],
			target: {
				directoryPath: null,
				flattenedSegmentPath: null,
				hoveredPath: null,
				kind: 'root'
			}
		};
		if (typeof options.dragAndDrop !== 'object')
			throw new Error('Expected a configured drop policy.');
		options.dragAndDrop.onDropError?.('Move denied', event);
		expect(adapterCallback).toHaveBeenCalledExactlyOnceWith('Move denied', event);
		expect(onDropError).toHaveBeenCalledExactlyOnceWith({ error: 'Move denied', event });
		expect(
			createTreeOptions({ paths: [] }, { dragAndDrop: false }, undefined, { onDropError })
				.dragAndDrop
		).toBe(false);
	});
});
