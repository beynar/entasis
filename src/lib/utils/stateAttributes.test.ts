import { describe, expect, test } from 'vitest';
import {
	applyStateAttributes,
	itemStateAttributes,
	openStateAttributes,
	parsePlacement,
	placementAttributes,
	popupTriggerAttributes,
	presence,
	stateDataAttributes,
	transitionStatusAttributes
} from './stateAttributes.js';

describe('state attributes', () => {
	test('presence attributes are empty strings or omitted', () => {
		expect(presence(true)).toBe('');
		expect(presence(0)).toBeUndefined();
		expect(openStateAttributes(true)).toEqual({ 'data-open': '', 'data-closed': undefined });
		expect(openStateAttributes(false)).toEqual({ 'data-open': undefined, 'data-closed': '' });
		expect(popupTriggerAttributes(true)).toEqual({ 'data-popup-open': '' });
	});

	test('transition status sets entering or exiting only while it plays', () => {
		expect(transitionStatusAttributes('entering')).toEqual({
			'data-entering': '',
			'data-exiting': undefined
		});
		expect(transitionStatusAttributes('exiting')).toEqual({
			'data-entering': undefined,
			'data-exiting': ''
		});
		expect(transitionStatusAttributes('open')).toEqual({
			'data-entering': undefined,
			'data-exiting': undefined
		});
	});

	test('placement splits into side and alignment', () => {
		expect(parsePlacement('bottom-start')).toEqual({ side: 'bottom', align: 'start' });
		expect(parsePlacement('left')).toEqual({ side: 'left', align: 'center' });
		expect(placementAttributes('top-end', { anchorHidden: true })).toEqual({
			'data-side': 'top',
			'data-align': 'end',
			'data-anchor-hidden': ''
		});
		expect(placementAttributes({ side: 'right' })).toEqual({
			'data-side': 'right',
			'data-align': 'center',
			'data-anchor-hidden': undefined
		});
		expect(placementAttributes(undefined)['data-side']).toBeUndefined();
	});

	test('item state', () => {
		expect(itemStateAttributes({ highlighted: true, selected: true })).toEqual({
			'data-highlighted': '',
			'data-disabled': undefined,
			'data-selected': ''
		});
	});

	test('applyStateAttributes sets and removes attributes', () => {
		const attributes = new Map<string, string>();
		const element = {
			getAttribute: (name: string) => attributes.get(name) ?? null,
			setAttribute: (name: string, value: string) => attributes.set(name, value),
			removeAttribute: (name: string) => attributes.delete(name)
		} as unknown as Element;
		applyStateAttributes(element, { ...openStateAttributes(true), 'data-side': 'top' });
		expect(Object.fromEntries(attributes)).toEqual({ 'data-open': '', 'data-side': 'top' });
		applyStateAttributes(element, openStateAttributes(false));
		expect(Object.fromEntries(attributes)).toEqual({ 'data-closed': '', 'data-side': 'top' });
	});

	test('every helper attribute is described', () => {
		const names = [
			...Object.keys(openStateAttributes(true)),
			...Object.keys(transitionStatusAttributes('open')),
			...Object.keys(placementAttributes('top')),
			...Object.keys(popupTriggerAttributes(true)),
			...Object.keys(itemStateAttributes({}))
		];
		expect(names.sort()).toEqual(Object.keys(stateDataAttributes).sort());
	});
});
