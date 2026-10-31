import {
	cva,
	setComponentTheme,
	useComponentTheme,
	type InferComponentTheme
} from '$lib/utils/cva/index.js';

// Holds the pad and, over its corner, the buttons: they cannot sit inside the pad, whose image
// role would hide them from assistive technology.
const defaultFrame = cva({
	base: 'relative w-full min-w-0'
});

// The pad is the control: it takes focus, so its own ring shows keyboard focus, and the strokes
// are drawn in its text color (an SVG in `currentColor`), so they follow the theme.
const defaultPad = cva({
	base: 'relative w-full min-w-0 touch-none overflow-hidden rounded-md border border-neutral-muted bg-surface-raised text-neutral outline-none select-none focus-visible:ring-2 focus-visible:ring-focus/50',
	variants: {
		size: {
			small: 'h-28',
			normal: 'h-36',
			large: 'h-44'
		},
		interactive: {
			true: 'cursor-crosshair',
			false: ''
		},
		disabled: {
			true: 'cursor-not-allowed opacity-50',
			false: ''
		},
		hasError: {
			true: 'border-danger focus-visible:ring-danger/50',
			false: ''
		}
	},
	defaultVariants: {
		size: 'normal',
		interactive: true,
		disabled: false,
		hasError: false
	}
});

const defaultInk = cva({
	base: 'pointer-events-none absolute inset-0 size-full overflow-visible'
});

// A value set from outside (a saved signature) shows as an image, scaled to fit the pad.
const defaultImage = cva({
	base: 'pointer-events-none absolute inset-0 size-full object-contain p-md'
});

// The line to sign on and its hint: decorative, gone as soon as there is ink.
const defaultPlaceholder = cva({
	base: 'pointer-events-none absolute inset-x-[var(--space-xl)] bottom-1/4 flex items-end gap-sm border-b border-dashed border-neutral-muted pb-xs text-neutral/45',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultActions = cva({
	base: 'absolute end-[var(--space-xs)] top-[var(--space-xs)] flex items-center gap-xs'
});

export const signatureInputTheme = {
	frame: defaultFrame,
	pad: defaultPad,
	ink: defaultInk,
	image: defaultImage,
	placeholder: defaultPlaceholder,
	actions: defaultActions
};

export type SignatureInputTheme = typeof signatureInputTheme;
export type SignatureInputThemeProps = InferComponentTheme<SignatureInputTheme>;
export const setSignatureInputTheme = setComponentTheme<SignatureInputTheme>('signature-input');
export const useSignatureInputTheme = useComponentTheme<SignatureInputTheme>(
	'signature-input',
	signatureInputTheme
);
