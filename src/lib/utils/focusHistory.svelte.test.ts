import { afterEach, describe, expect, test } from 'vitest';
import {
	FOCUS_HISTORY_SIZE,
	clearFocusHistory,
	findFocusFallback,
	getFocusHistory,
	installFocusHistory
} from './focusHistory.js';

const mounted: HTMLElement[] = [];
const add = (tag = 'button', parent: HTMLElement = document.body) => {
	const element = document.createElement(tag);
	if (tag === 'div') element.tabIndex = 0;
	parent.append(element);
	mounted.push(element);
	return element;
};

afterEach(() => {
	mounted.splice(0).forEach((element) => element.remove());
	clearFocusHistory();
});

describe('focus history', () => {
	test('remembers focused elements, newest first, once each', () => {
		const stop = installFocusHistory(document);
		const [a, b, c] = [add(), add(), add()];
		for (const element of [a, b, c, a]) element.focus();
		expect(getFocusHistory()).toEqual([a, c, b]);
		stop();
	});

	test('keeps the newest 20 and skips elements that left the page', () => {
		const stop = installFocusHistory(document);
		const all = Array.from({ length: FOCUS_HISTORY_SIZE + 5 }, () => add());
		for (const element of all) element.focus();
		const history = getFocusHistory();
		expect(history).toHaveLength(FOCUS_HISTORY_SIZE);
		expect(history[0]).toBe(all.at(-1));
		all.at(-1)!.remove();
		expect(getFocusHistory()[0]).toBe(all.at(-2));
		stop();
	});

	test('records the real target inside an open shadow root', () => {
		const stop = installFocusHistory(document);
		const host = add('div');
		const inner = document.createElement('button');
		host.attachShadow({ mode: 'open' }).append(inner);
		inner.focus();
		expect(getFocusHistory()).toContain(inner);
		stop();
	});

	test('the listener stays until every install has been released', () => {
		const stopA = installFocusHistory(document);
		const stopB = installFocusHistory(document);
		stopA();
		const a = add();
		a.focus();
		expect(getFocusHistory()).toEqual([a]);
		stopB();
		stopB();
		const b = add();
		b.focus();
		expect(getFocusHistory()).toEqual([]);
	});

	test('the fallback skips excluded, inert, disabled and unrendered elements', () => {
		const stop = installFocusHistory(document);
		const good = add();
		const disabled = add();
		const inert = add('div');
		const inside = add();
		const hidden = add();
		const closing = add('div');
		closing.append(inside);
		good.focus();
		for (const element of [disabled, inert, inside, hidden]) element.focus();
		(disabled as HTMLButtonElement).disabled = true;
		inert.setAttribute('inert', '');
		hidden.style.display = 'none';
		Object.defineProperty(hidden, 'getClientRects', { value: () => [] });
		expect(findFocusFallback(document, { exclude: closing })).toBe(good);
		stop();
	});
});
