// An inactive link Button carries no `href` in the server markup: before hydration nothing refuses
// a click, so a link that still had its address would navigate.
import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import Button from './Button.svelte';

const anchorTag = (props: Record<string, unknown>) =>
	render(Button, { props: { children: 'Continue', href: '/next', ...props } }).body.match(
		/<a[^>]*>/
	)?.[0] ?? '';

describe('inactive link Button in server markup', () => {
	test('loading drops the href, announces it, and stays in the tab order', () => {
		const tag = anchorTag({ loading: true });
		expect(tag).not.toContain('href=');
		expect(tag).toContain('aria-disabled="true"');
		expect(tag).toContain('aria-busy="true"');
		expect(tag).toContain('tabindex="0"');
	});

	test('disabled drops the href and leaves the tab order', () => {
		const tag = anchorTag({ disabled: true });
		expect(tag).not.toContain('href=');
		expect(tag).toContain('aria-disabled="true"');
		expect(tag).toContain('tabindex="-1"');
	});

	test('an active link keeps its href', () => {
		expect(anchorTag({})).toContain('href="/next"');
	});
});
