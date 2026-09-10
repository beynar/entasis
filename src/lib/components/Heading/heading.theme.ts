import { cva } from '$lib/utils/cva/index.js';

const heading = cva({
	base: '[text-box-edge:cap_alphabetic]',
	variants: {
		size: {
			h1: 'text-4xl',
			h2: 'text-3xl',
			h3: 'text-2xl',
			h4: 'text-xl',
			h5: 'text-lg',
			h6: 'text-base'
		},
		weight: {
			normal: 'font-normal',
			bold: 'font-bold',
			light: 'font-light'
		},
		align: {
			left: 'text-left',
			center: 'text-center',
			right: 'text-right'
		},
		balanced: {
			true: 'text-balance',
			false: 'text-wrap'
		},
		underline: {
			true: 'underline',
			false: ''
		},
		muted: {
			true: 'text-neutral/60',
			false: ''
		},
		trim: {
			start: '[text-box-trim:trim-start]',
			end: '[text-box-trim:trim-end]',
			both: '[text-box-trim:trim-both]',
			none: '[text-box-trim:none]'
		}
	}
});

export const headingTheme = { root: heading };
