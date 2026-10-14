import { afterEach, describe, expect, test } from 'vitest';
import { elementById } from './id.js';

afterEach(() => {
	document.body.innerHTML = '';
});

const withId = (id: string, parent: ParentNode = document.body) => {
	const element = document.createElement('div');
	element.id = id;
	parent.append(element);
	return element;
};

describe('elementById', () => {
	test('finds an element in the document of the node it starts from', () => {
		const target = withId('in-document');
		const from = withId('from');
		expect(elementById(from, 'in-document')).toBe(target);
	});

	test('searches the shadow root the node renders in, which document.getElementById cannot see', () => {
		const host = withId('host');
		const shadow = host.attachShadow({ mode: 'open' });
		const target = withId('in-shadow', shadow);
		const from = withId('from', shadow);
		expect(document.getElementById('in-shadow')).toBeNull();
		expect(elementById(from, 'in-shadow')).toBe(target);
	});

	test('falls back to the page document for a panel portaled out of the shadow root', () => {
		const host = withId('host');
		const from = withId('from', host.attachShadow({ mode: 'open' }));
		const target = withId('in-document');
		expect(elementById(from, 'in-document')).toBe(target);
	});

	test('a detached node falls back to the page document', () => {
		const target = withId('in-document');
		expect(elementById(document.createElement('div'), 'in-document')).toBe(target);
	});

	test('without a node the page document is searched', () => {
		const target = withId('in-document');
		expect(elementById(null, 'in-document')).toBe(target);
		expect(elementById(undefined, 'in-document')).toBe(target);
	});

	test('a missing id is null', () => {
		expect(elementById(withId('from'), 'nope')).toBeNull();
		expect(elementById(null, 'nope')).toBeNull();
	});
});
