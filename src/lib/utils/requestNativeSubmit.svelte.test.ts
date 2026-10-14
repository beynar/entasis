// jsdom (a *.svelte.test.ts file): form ownership, `form.elements` and submit events need a DOM.
import { afterEach, describe, expect, test, vi } from 'vitest';
import { getDefaultSubmitter, getNativeForm, requestNativeSubmit } from './requestNativeSubmit.js';

const mount = (html: string) => {
	document.body.innerHTML = html;
	const submitted = vi.fn();
	for (const form of document.forms) {
		form.addEventListener('submit', (event) => {
			event.preventDefault();
			submitted(form.id, (event as SubmitEvent).submitter?.id ?? null);
		});
	}
	return submitted;
};
const byId = (id: string) => document.getElementById(id)!;

afterEach(() => {
	document.body.innerHTML = '';
});

describe('getNativeForm', () => {
	test('a form control resolves its form owner, form attribute included', () => {
		mount(`
			<form id="a"><button id="inside" type="button"></button></form>
			<form id="b"><button id="pointed" type="button" form="a"></button></form>
			<form id="c"><button id="dangling" type="button" form="missing"></button></form>
		`);
		expect(getNativeForm(byId('inside'))?.id).toBe('a');
		expect(getNativeForm(byId('pointed'))?.id).toBe('a');
		// A form attribute that names no form leaves the control without one, as in the browser.
		expect(getNativeForm(byId('dangling'))).toBeNull();
	});

	test('any other element resolves the closest form, and a form resolves itself', () => {
		mount(`<form id="a"><div id="control" role="checkbox"></div></form><div id="outside"></div>`);
		expect(getNativeForm(byId('control'))?.id).toBe('a');
		expect(getNativeForm(byId('a'))?.id).toBe('a');
		expect(getNativeForm(byId('outside'))).toBeNull();
		expect(getNativeForm(null)).toBeNull();
	});
});

describe('getDefaultSubmitter', () => {
	test('is the first submit button in tree order, counting buttons outside with a form attribute', () => {
		mount(`
			<button id="outside" form="a"></button>
			<form id="a">
				<button id="plain" type="button"></button>
				<input id="first" type="submit" />
				<button id="second"></button>
			</form>
		`);
		expect(getDefaultSubmitter(byId('a') as HTMLFormElement)?.id).toBe('outside');
	});
});

describe('requestNativeSubmit', () => {
	test("clicks the form's default button, which is the event's submitter", () => {
		const submitted = mount(`
			<form id="a">
				<div id="control" role="checkbox" tabindex="0"></div>
				<button id="save">Save</button>
				<button id="other">Other</button>
			</form>
		`);
		const onclick = vi.fn();
		byId('save').addEventListener('click', onclick);

		expect(requestNativeSubmit(byId('control'))).toBe(true);
		expect(onclick).toHaveBeenCalledOnce();
		expect(submitted).toHaveBeenCalledExactlyOnceWith('a', 'save');
	});

	test('submits the form a control outside it names', () => {
		const submitted = mount(`
			<form id="a"><button id="save">Save</button></form>
			<button id="control" type="button" form="a"></button>
		`);
		expect(requestNativeSubmit(byId('control'))).toBe(true);
		expect(submitted).toHaveBeenCalledExactlyOnceWith('a', 'save');
	});

	test('does nothing without a submit button, like Enter on a native checkbox', () => {
		const submitted = mount(
			`<form id="a"><div id="control"></div><button type="button">No</button></form>`
		);
		expect(requestNativeSubmit(byId('control'))).toBe(false);
		expect(submitted).not.toHaveBeenCalled();
	});

	test('does nothing when the default button is disabled, even if a later one is enabled', () => {
		const submitted = mount(`
			<form id="a">
				<div id="control"></div>
				<button id="first" disabled>First</button>
				<button id="second">Second</button>
			</form>
			<form id="b">
				<div id="fieldset-control"></div>
				<fieldset disabled><button id="third">Third</button></fieldset>
			</form>
		`);
		expect(requestNativeSubmit(byId('control'))).toBe(false);
		expect(requestNativeSubmit(byId('fieldset-control'))).toBe(false);
		expect(submitted).not.toHaveBeenCalled();
	});

	test('constraint validation still runs: an invalid form is not submitted', () => {
		const submitted = mount(`
			<form id="a">
				<input name="email" required />
				<div id="control"></div>
				<button id="save">Save</button>
			</form>
		`);
		expect(requestNativeSubmit(byId('control'))).toBe(true);
		expect(submitted).not.toHaveBeenCalled();
	});

	test('an element outside any form submits nothing', () => {
		mount(`<div id="control"></div><form id="a"><button>Save</button></form>`);
		expect(requestNativeSubmit(byId('control'))).toBe(false);
	});
});
