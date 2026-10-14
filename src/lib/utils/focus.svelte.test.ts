import { afterEach, describe, expect, test } from 'vitest';
import {
	composedContains,
	getDeepActiveElement,
	getTabbableAfter,
	isFocusable,
	isTextField
} from './focus.js';

const mounted: HTMLElement[] = [];
const add = (tag: string, parent: Node = document.body) => {
	const element = document.createElement(tag);
	parent.appendChild(element);
	mounted.push(element);
	return element as HTMLElement;
};

afterEach(() => mounted.splice(0).forEach((element) => element.remove()));

describe('getDeepActiveElement', () => {
	test('returns the focused element inside nested open shadow roots, not the host', () => {
		const outer = add('div');
		const middle = document.createElement('div');
		outer.attachShadow({ mode: 'open' }).append(middle);
		const innerHost = middle;
		const button = document.createElement('button');
		innerHost.attachShadow({ mode: 'open' }).append(button);
		button.focus();
		expect(document.activeElement).toBe(outer);
		expect(getDeepActiveElement(document)).toBe(button);
	});

	test('is the focused SVG element, not null', () => {
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
		circle.setAttribute('tabindex', '0');
		svg.append(circle);
		document.body.append(svg);
		circle.focus();
		expect(document.activeElement).toBe(circle);
		expect(getDeepActiveElement(document)).toBe(circle);
		svg.remove();
	});

	test('is the body when nothing is focused', () => {
		expect(getDeepActiveElement(document)).toBe(document.body);
	});
});

describe('composedContains', () => {
	test('sees through shadow boundaries, which Node.contains does not', () => {
		const host = add('div');
		const inner = document.createElement('button');
		host.attachShadow({ mode: 'open' }).append(inner);
		expect(host.contains(inner)).toBe(false);
		expect(composedContains(host, inner)).toBe(true);
		expect(composedContains(host, add('div'))).toBe(false);
	});
});

describe('isFocusable', () => {
	test('accepts tabindex -1 and refuses disabled, inert and detached elements', () => {
		const roving = add('div');
		roving.tabIndex = -1;
		const disabled = add('button') as HTMLButtonElement;
		disabled.disabled = true;
		const wrapper = add('div');
		const nested = add('button', wrapper);
		wrapper.setAttribute('inert', '');
		const detached = document.createElement('button');
		expect(isFocusable(roving)).toBe(true);
		expect(isFocusable(disabled)).toBe(false);
		expect(isFocusable(nested)).toBe(false);
		expect(isFocusable(detached)).toBe(false);
		expect(isFocusable(add('div'))).toBe(false);
	});
});

describe('isTextField', () => {
	test('text inputs, textareas and editable regions; not buttons or checkboxes', () => {
		expect(isTextField(add('textarea'))).toBe(true);
		const text = add('input') as HTMLInputElement;
		expect(isTextField(text)).toBe(true);
		const checkbox = add('input') as HTMLInputElement;
		checkbox.type = 'checkbox';
		expect(isTextField(checkbox)).toBe(false);
		expect(isTextField(add('button'))).toBe(false);
		expect(isTextField(null)).toBe(false);
	});
});

describe('getTabbableAfter', () => {
	test('is the nearest tabbable that follows, skipping the excluded panel and own children', () => {
		const trigger = add('div');
		trigger.tabIndex = 0;
		const own = add('button', trigger);
		const panel = add('div');
		const inPanel = add('button', panel);
		const after = add('button');
		const later = add('button');
		void own;
		void inPanel;
		void later;
		// Document order here is trigger > own, panel > inPanel, after, later.
		expect(getTabbableAfter(trigger, { exclude: panel })).toBe(after);
		expect(getTabbableAfter(later, { exclude: panel })).toBeNull();
	});

	test('honours a boundary', () => {
		const region = add('div');
		const first = add('button', region);
		const second = add('button', region);
		add('button');
		expect(getTabbableAfter(first, { boundary: region })).toBe(second);
		expect(getTabbableAfter(second, { boundary: region })).toBeNull();
	});
});
