// The DOM rules agents are held to, in real engines: names as a screen reader computes them,
// decorative subtrees, the `data-webmcp-off` zone, and the text a cell shows.
import { afterEach, describe, expect, test } from 'vitest';
import {
	accessibleName,
	isAgentOff,
	isDecorative,
	isReachableNow,
	readableText
} from './webmcp.dom.js';

const mount = (html: string): HTMLElement => {
	const host = document.createElement('div');
	host.innerHTML = html;
	document.body.append(host);
	return host;
};

const byId = (id: string) => document.getElementById(id) as HTMLElement;

afterEach(() => {
	document.body.replaceChildren();
});

describe('accessibleName', () => {
	test('aria-labelledby first, then aria-label, then the announced content', () => {
		mount(`
			<span id="first">Archive</span><span id="second" hidden>thread</span>
			<button id="labelled" aria-labelledby="first second" aria-label="Ignored">Go</button>
			<button id="labelled-by-label" aria-label="Close panel">×</button>
			<button id="content">Save <kbd aria-hidden="true">⌘S</kbd><span style="display:none">gone</span></button>
			<button id="image"><img alt="Delete" src="data:," /></button>
			<a id="nested" href="/x"><span aria-label="Settings">⚙</span></a>
		`);
		expect(accessibleName(byId('labelled'))).toBe('Archive thread');
		expect(accessibleName(byId('labelled-by-label'))).toBe('Close panel');
		expect(accessibleName(byId('content'))).toBe('Save');
		expect(accessibleName(byId('image'))).toBe('Delete');
		expect(accessibleName(byId('nested'))).toBe('Settings');
	});
});

describe('reach', () => {
	test('aria-hidden marks decoration, except the page a third-party modal hides', () => {
		mount(`
			<div aria-hidden="true" inert><button id="copy">Open</button></div>
			<div aria-hidden="true" data-aria-hidden="true"><button id="behind">Open</button></div>
			<button id="plain">Open</button>
		`);
		expect(isDecorative(byId('copy'))).toBe(true);
		expect(isDecorative(byId('behind'))).toBe(false);
		expect(isDecorative(byId('plain'))).toBe(false);
		expect(isReachableNow(byId('behind'))).toBe(false);
		expect(isReachableNow(byId('plain'))).toBe(true);
	});

	test('data-webmcp-off takes a subtree, "false" leaves it, and text nodes follow their parent', () => {
		mount(`
			<section data-webmcp-off><p id="off">Secret</p></section>
			<section data-webmcp-off="false"><p id="on">Public</p></section>
		`);
		expect(isAgentOff(byId('off'))).toBe(true);
		expect(isAgentOff(byId('off').firstChild)).toBe(true);
		expect(isAgentOff(byId('on'))).toBe(false);
		expect(isAgentOff(null)).toBe(false);
	});
});

describe('readableText', () => {
	test('reads what a person reads, without what assistive technology skips', () => {
		mount(
			`<table><tbody><tr><td id="cell"><span aria-hidden="true">●</span> Paid <span>in full</span><template>x</template></td></tr></tbody></table>`
		);
		expect(readableText(byId('cell'))).toBe('Paid in full');
	});
});
