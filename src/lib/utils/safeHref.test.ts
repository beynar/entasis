import { describe, expect, test } from 'vitest';
import { safeHref } from './safeHref.js';

describe('safeHref', () => {
	test.each([
		'https://example.com/a',
		'http://example.com',
		'mailto:a@example.com',
		'tel:+33123456789',
		'sms:+33123456789',
		'/dashboard',
		'dashboard/a',
		'./a',
		'../a',
		'#section',
		'?tab=2',
		'//example.com/a',
		'',
		'myapp://open/a',
		'custom-app://open',
		'tauri://localhost/a',
		'file:///Users/a/report.pdf',
		'blob:https://example.com/a',
		'data:text/plain;charset=utf-8,notes',
		'data:text/csv,a,b',
		'data:application/pdf;base64,AAAA',
		'data:image/png;base64,AAAA',
		'data:,html',
		'http://[not-an-address'
	])('%j is followed', (href) => {
		expect(safeHref(href)).toBe(href);
	});

	test.each([
		'javascript:alert(1)',
		'JaVaScRiPt:alert(1)',
		' javascript:alert(1)',
		'\tjavascript:alert(1)',
		'java\tscript:alert(1)',
		'java\nscript:alert(1)',
		'\u0001javascript:alert(1)',
		'vbscript:msgbox(1)',
		'data:text/html,<script>alert(1)</script>',
		'DATA:TEXT/HTML,x',
		' data:text/html;base64,AAAA',
		'data:application/xhtml+xml,x',
		'data:image/svg+xml,<svg onload="alert(1)"/>',
		'data:text/xml,x'
	])('%j is not', (href) => {
		expect(safeHref(href)).toBeUndefined();
	});

	test.each([undefined, null, 1, true, {}])('%j is not an address', (href) => {
		expect(safeHref(href)).toBeUndefined();
	});
});
