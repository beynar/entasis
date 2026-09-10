import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

const defaultMultiStep = cva({
	base: 'relative flex min-w-0 flex-col',
	variants: {
		variant: {
			plain: 'p-md',
			sectioned: 'p-md',
			card: ''
		}
	},
	defaultVariants: {
		variant: 'plain'
	}
});

const defaultMultiStepHeader = cva({
	base: ''
});

const defaultMultiStepContent = cva({
	base: 'min-w-0'
});

const defaultMultiStepFooter = cva({
	base: 'flex justify-between gap-md'
});

export const multiStepFormTheme = {
	root: defaultMultiStep,
	multiStepFormHeader: defaultMultiStepHeader,
	multiStepFormContent: defaultMultiStepContent,
	multiStepFormFooter: defaultMultiStepFooter
};

export type MultiStepFormTheme = typeof multiStepFormTheme;
export type MultiStepFormThemeProps = InferComponentTheme<MultiStepFormTheme>;
export const setMultiStepFormTheme = setComponentTheme<MultiStepFormTheme>('multiStepForm');
export const useMultiStepFormTheme = useComponentTheme<MultiStepFormTheme>(
	'multiStepForm',
	multiStepFormTheme
);
