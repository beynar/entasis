import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

const defaultMultiStep = cva({
	base: 'relative flex min-w-0 flex-col',
	variants: {
		variant: {
			plain: 'gap-xl',
			sectioned: 'gap-xl',
			card: ''
		}
	},
	defaultVariants: {
		variant: 'plain'
	}
});

const defaultMultiStepHeader = cva({
	base: 'px-xl',
	variants: {
		variant: {
			plain: '',
			sectioned: '',
			card: 'border-b border-neutral-muted pb-xl'
		}
	},
	defaultVariants: {
		variant: 'plain'
	}
});

const defaultMultiStepContent = cva({
	base: 'min-w-0 px-xl'
});

const defaultMultiStepFooter = cva({
	base: 'flex justify-between gap-md px-xl',
	variants: {
		variant: {
			plain: '',
			sectioned: '',
			card: 'border-t border-neutral-muted pt-xl'
		}
	},
	defaultVariants: {
		variant: 'plain'
	}
});

export const multiStepFormTheme = {
	root: defaultMultiStep,
	multiStepFormHeader: defaultMultiStepHeader,
	multiStepFormContent: defaultMultiStepContent,
	multiStepFormFooter: defaultMultiStepFooter
};

export type MultiStepFormTheme = typeof multiStepFormTheme;
export type MultiStepFormThemeProps = InferComponentTheme<MultiStepFormTheme>;
export const setMultiStepFormTheme = setComponentTheme<MultiStepFormTheme>('multi-step-form');
export const useMultiStepFormTheme = useComponentTheme<MultiStepFormTheme>(
	'multiStepForm',
	multiStepFormTheme
);
