// Row menus open toward the page from whichever edge the sidebar sits on, as logical sides that
// Popover resolves against the reading direction (lane R4, SB-1).
import { describe, expect, test } from 'vitest';
import {
	getSidebarMenuPosition,
	sidebarInwardPhysicalSide,
	sidebarInwardSide
} from './sidebar-position.js';

describe('getSidebarMenuPosition', () => {
	test('a desktop menu opens toward the page', () => {
		expect(getSidebarMenuPosition(undefined, undefined, { isMobile: false })).toBe(
			'inline-end-start'
		);
		expect(getSidebarMenuPosition(undefined, undefined, { isMobile: false, side: 'left' })).toBe(
			'inline-end-start'
		);
		expect(getSidebarMenuPosition(undefined, undefined, { isMobile: false, side: 'right' })).toBe(
			'inline-start-start'
		);
		expect(getSidebarMenuPosition(undefined, 'end', { isMobile: false, side: 'right' })).toBe(
			'inline-start-end'
		);
		expect(getSidebarMenuPosition(undefined, 'center', { isMobile: false, side: 'right' })).toBe(
			'inline-start'
		);
	});

	test('a mobile menu opens below its row', () => {
		expect(getSidebarMenuPosition(undefined, undefined, { isMobile: true, side: 'right' })).toBe(
			'bottom-end'
		);
	});

	test('an explicit side wins, physical or logical', () => {
		expect(getSidebarMenuPosition('top', 'center', { isMobile: false, side: 'right' })).toBe('top');
		expect(getSidebarMenuPosition('right', undefined, { isMobile: false, side: 'right' })).toBe(
			'right-start'
		);
		expect(getSidebarMenuPosition('inline-start', 'center', { isMobile: true })).toBe(
			'inline-start'
		);
	});
});

test('the inward side faces away from the sidebar edge in either reading direction', () => {
	expect(sidebarInwardSide(undefined)).toBe('inline-end');
	expect(sidebarInwardSide('right')).toBe('inline-start');
	expect(sidebarInwardPhysicalSide('left', 'ltr')).toBe('right');
	expect(sidebarInwardPhysicalSide('right', 'ltr')).toBe('left');
	expect(sidebarInwardPhysicalSide('left', 'rtl')).toBe('left');
	expect(sidebarInwardPhysicalSide('right', 'rtl')).toBe('right');
});
