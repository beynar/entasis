// The hand-drawn arrows, one per placement, in a 46 by 38 box: a shaft and a head, both stroked.
// A `start` placement mirrors into its `end` twin when the text runs from right to left.
//
// @license Adapted from neat-annotations (github.com/syabro/neat-annotations).
// Copyright (c) 2026 Maxim Syabro. SPDX-License-Identifier: MIT

import type { AnnotationPlacement } from './annotation.props.js';

export const ANNOTATION_ARROWS: Record<
	AnnotationPlacement,
	readonly [shaft: string, head: string]
> = {
	bottom: ['M23 35 C22 26 22 15 23 4', 'M17 10 L23 3 L29 10'],
	'bottom-start': ['M6 32 C16 30 28 18 40 6', 'M30 10 L40 6 L36 16'],
	'bottom-end': ['M40 32 C30 30 18 18 6 6', 'M16 10 L6 6 L10 16'],
	top: ['M23 4 C22 13 22 24 23 35', 'M17 29 L23 36 L29 29'],
	'top-start': ['M6 6 C16 8 28 20 40 32', 'M36 22 L40 32 L30 28'],
	'top-end': ['M40 6 C30 8 18 20 6 32', 'M10 22 L6 32 L16 28'],
	left: ['M4 19 C15 18 31 18 43 19', 'M36 13 L43 19 L36 25'],
	right: ['M43 19 C32 18 15 18 3 19', 'M10 13 L3 19 L10 25']
};
