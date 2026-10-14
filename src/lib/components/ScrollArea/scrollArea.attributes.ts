/**
 * The styling hooks a ScrollArea exposes. Attributes are presence attributes (`''` while the
 * state holds, omitted otherwise) unless the description says they carry a value; the variables
 * are set on the root element in px.
 */
export const scrollAreaDataAttributes = {
	'data-scrolling':
		'On the root, the viewport, the scrollbars and the thumbs: present from the first scroll event until the viewport has been idle for 400 ms.',
	'data-has-overflow-x': 'On the root: present while the content overflows horizontally.',
	'data-has-overflow-y': 'On the root: present while the content overflows vertically.',
	'data-overflow-x-start':
		'On the root: present while content is hidden past the inline start edge (to the left in LTR, to the right in RTL).',
	'data-overflow-x-end':
		'On the root: present while content is hidden past the inline end edge (to the right in LTR, to the left in RTL).',
	'data-overflow-y-start': 'On the root: present while content is hidden above the viewport.',
	'data-overflow-y-end': 'On the root: present while content is hidden below the viewport.',
	'data-orientation':
		'On the scrollbars and thumbs: `vertical` or `horizontal`, the axis they scroll.'
} as const;

/** The name of a ScrollArea data attribute. */
export type ScrollAreaDataAttribute = keyof typeof scrollAreaDataAttributes;

export const scrollAreaCssVariables = {
	'--scroll-area-overflow-x-start':
		'Px of content hidden past the inline start edge (0 while the axis does not overflow).',
	'--scroll-area-overflow-x-end':
		'Px of content hidden past the inline end edge (0 while the axis does not overflow).',
	'--scroll-area-overflow-y-start': 'Px of content hidden above the viewport.',
	'--scroll-area-overflow-y-end': 'Px of content hidden below the viewport.'
} as const;

/** The name of a ScrollArea CSS variable. */
export type ScrollAreaCssVariable = keyof typeof scrollAreaCssVariables;
