import { describe, expect, test } from 'vitest';
import { avatarTheme } from './avatar.theme.js';
import { avatarGroupTheme } from './avatarGroup.theme.js';

/*
 * A stack reads the same at every size only while each avatar overlaps its neighbour by the same
 * share of its own width. Small once overlapped over a quarter of its 24px and slid each circle
 * across the end of the previous avatar's two-letter initials.
 */
const sizes = ['small', 'normal', 'large'] as const;
const remPx = 16;
const spacingPx = 4;

describe('AvatarGroup overlap', () => {
	test('every size overlaps by about a fifth of its avatar', () => {
		for (const size of sizes) {
			const width =
				Number(avatarTheme.root({ size }).match(/\bsize-(\d+(?:\.\d+)?)\b/)?.[1]) * spacingPx;
			const overlap =
				Number(avatarGroupTheme.root({ size }).match(/ml-\[-(\d+(?:\.\d+)?)rem\]/)?.[1]) * remPx;
			expect(width, size).toBeGreaterThan(0);
			expect(overlap / width, size).toBeGreaterThanOrEqual(0.18);
			expect(overlap / width, size).toBeLessThanOrEqual(0.23);
		}
	});

	test('small initials tighten their tracking, since the type scale has no smaller step', () => {
		expect(avatarTheme.avatarInitials({ size: 'small' })).toContain('tracking-tight');
	});
});
