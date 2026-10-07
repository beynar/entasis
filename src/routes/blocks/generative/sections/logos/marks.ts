import type { Snippet } from 'svelte';
import { birdIconFill } from 'entasis/icons/bird';
import { dropIconFill } from 'entasis/icons/drop';
import { equalsIconBold } from 'entasis/icons/equals';
import { featherIconFill } from 'entasis/icons/feather';
import { globeHemisphereWestIconFill } from 'entasis/icons/globeHemisphereWest';
import { hexagonIconFill } from 'entasis/icons/hexagon';
import { lightningIconFill } from 'entasis/icons/lightning';
import { mapPinIconFill } from 'entasis/icons/mapPin';
import { planetIconFill } from 'entasis/icons/planet';
import { sunIconFill } from 'entasis/icons/sun';
import { wavesIconBold } from 'entasis/icons/waves';
import { windIconBold } from 'entasis/icons/wind';
import { logoNames } from '../content.js';

/**
 * Illustrative customer marks. Each name from the copy deck gets a glyph and its own type
 * treatment, so a row reads as a dozen different companies rather than one font repeated. Sizes
 * and ink come from the section rendering the mark, never from here.
 */
export interface LogoMark {
	name: string;
	icon: Snippet;
	/** Weight, family, case and tracking — the part that makes a wordmark look like a logo. */
	type: string;
}

const treatments: Array<[Snippet, string]> = [
	[windIconBold, 'font-semibold tracking-tight'],
	[sunIconFill, 'font-light tracking-wide'],
	[birdIconFill, 'font-bold'],
	[globeHemisphereWestIconFill, 'font-serif font-medium italic'],
	[featherIconFill, 'font-medium tracking-tight'],
	[wavesIconBold, 'font-semibold tracking-widest uppercase'],
	[equalsIconBold, 'font-black tracking-tighter'],
	[planetIconFill, 'font-semibold lowercase'],
	[dropIconFill, 'font-serif'],
	[hexagonIconFill, 'font-bold tracking-tight uppercase'],
	[mapPinIconFill, 'font-medium'],
	[lightningIconFill, 'font-bold italic']
];

export const logoMarks: LogoMark[] = logoNames.map((name, index) => ({
	name,
	icon: treatments[index % treatments.length][0],
	type: treatments[index % treatments.length][1]
}));

/** The mark of the company a testimonial role names (`'VP Product, Northwind'`). */
export const markForRole = (role: string): LogoMark | undefined => {
	const company = role.split(', ').at(-1) ?? '';
	return logoMarks.find((mark) => company.startsWith(mark.name));
};
