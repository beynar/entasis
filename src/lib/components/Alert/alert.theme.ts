import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

const defaultAlert = cva({
	base: 'relative w-full rounded-md border px-xl py-lg text-sm flex gap-lg items-start',
	variants: {
		hasIcon: {
			true: '',
			false: ''
		},
		color: {
			primary: 'bg-primary text-primary-contrast border-primary',
			secondary: 'bg-secondary text-secondary-contrast border-secondary',
			neutral: 'bg-neutral text-neutral-contrast border-neutral',
			danger: 'bg-danger text-danger-contrast border-danger',
			success: 'bg-success text-success-contrast border-success',
			warning: 'bg-warning text-warning-contrast border-warning',
			info: 'bg-info text-info-contrast border-info'
		},
		variant: {
			solid: 'bg-color text-color-contrast border-color',
			outline: 'bg-color/0 border-color text-color-readable',
			// The soft "toast" look: muted tint, colored border and a legible on-tint
			// accent (`muted-readable` = dark text light-mode, light text dark-mode).
			soft: 'bg-color-muted text-color-muted-readable border-color/20'
		},
		size: {
			small: 'px-lg py-md text-xs',
			normal: 'px-xl py-lg text-sm',
			large: 'px-xl py-xl text-base'
		},
		disabled: {
			true: 'opacity-55 cursor-not-allowed pointer-events-none',
			false: null
		},
		hasDescription: {
			true: '',
			false: ''
		},
		hasTitle: {
			true: '',
			false: ''
		}
	},
	defaultVariants: {
		hasIcon: false,
		color: 'neutral',
		variant: 'solid',
		size: 'normal',
		disabled: false
	},
	compoundVariants: [
		{
			hasDescription: false,
			hasTitle: true,
			hasIcon: true,
			class: 'items-center'
		}
	]
});

const defaultAlertPrefix = cva({
	base: 'shrink-0 [&>svg]:text-current',
	variants: {
		size: {
			small: '[&>svg]:size-4 ',
			normal: '[&>svg]:size-5 ',
			large: '[&>svg]:size-6 '
		},
		// Soft alerts show a vivid, saturated icon badge (like the toast) rather than
		// inheriting the muted-readable text color.
		variant: {
			solid: '',
			outline: '',
			soft: '[&>svg]:text-color-readable'
		},
		// Nudge the icon to the first text line only in multi-line alerts. A title-only
		// alert centers its row (items-center), so no nudge — keeps icon/title/close level.
		hasDescription: {
			true: 'translate-y-0.5',
			false: ''
		}
	},
	defaultVariants: {
		size: 'normal',
		variant: 'solid',
		hasDescription: false
	}
});

// Inline close button (top-right, aligned with the title). Subtle by default,
// tinting on hover — mirrors the toast's close affordance.
const defaultAlertClose = cva({
	base: 'state-layer shrink-0 -mr-xs flex items-center justify-center rounded-sm leading-none transition-colors outline-none focus-visible:ring-2 focus-visible:ring-color/40',
	variants: {
		size: {
			small: 'size-5 [&>svg]:size-3.5',
			normal: 'size-6 [&>svg]:size-4',
			large: 'size-7 [&>svg]:size-5'
		},
		variant: {
			solid: 'text-current/60 hover:text-current',
			outline: 'text-current/60 hover:text-current',
			soft: 'text-color-muted-readable/70 hover:text-color-muted-readable'
		}
	},
	defaultVariants: {
		size: 'normal',
		variant: 'solid'
	}
});

const defaultAlertTitle = cva({
	base: 'line-clamp-2 font-medium',
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

const defaultAlertContent = cva({
	base: 'flex min-w-0 flex-1 flex-col gap-micro'
});

const defaultAlertDescription = cva({
	base: 'flex flex-col gap-xs text-sm [&_p]:leading-relaxed',
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

export const alertTheme = {
	root: defaultAlert,
	prefix: defaultAlertPrefix,
	content: defaultAlertContent,
	title: defaultAlertTitle,
	description: defaultAlertDescription,
	close: defaultAlertClose
};

export type AlertTheme = typeof alertTheme;
export type AlertThemeProps = InferComponentTheme<AlertTheme>;
export const setAlertTheme = setComponentTheme<AlertTheme>('alert');
export const useAlertTheme = useComponentTheme<AlertTheme>('alert', alertTheme);
