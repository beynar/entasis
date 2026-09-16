import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

// Confirmation renders an alert Dialog, which owns the surface theme. These two slots are
// what Confirmation itself styles: extra classes for the dialog surface, and the button row
// it builds in the dialog footer.
const defaultConfirmationRoot = cva({
	base: ''
});

const defaultConfirmationFooter = cva({
	base: 'flex p-md',
	variants: {
		// Narrow viewports stack the buttons full-width instead of trailing them.
		layout: {
			stacked: 'flex-col gap-xl',
			inline: 'justify-end gap-md'
		}
	},
	defaultVariants: {
		layout: 'inline'
	}
});

export const confirmationTheme = {
	root: defaultConfirmationRoot,
	footer: defaultConfirmationFooter
};

export type ConfirmationTheme = typeof confirmationTheme;
export type ConfirmationThemeProps = InferComponentTheme<ConfirmationTheme>;
export const setConfirmationTheme = setComponentTheme<ConfirmationTheme>('confirmation');
export const useConfirmationTheme = useComponentTheme<ConfirmationTheme>(
	'confirmation',
	confirmationTheme
);
