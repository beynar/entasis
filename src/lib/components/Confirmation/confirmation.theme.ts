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
			inline: 'justify-end gap-md',
			// Inside the anchored popover: small buttons, no padding of their own.
			compact: 'p-0 pt-xs justify-end gap-sm'
		}
	},
	defaultVariants: {
		layout: 'inline'
	}
});

// The anchored question `popconfirm()` opens: a title, an optional description, the buttons.
const defaultConfirmationPopover = cva({
	base: 'flex max-w-72 flex-col gap-xs p-xs'
});

const defaultConfirmationTitle = cva({
	base: 'text-sm font-medium text-neutral'
});

const defaultConfirmationDescription = cva({
	base: 'text-sm text-neutral/70'
});

export const confirmationTheme = {
	root: defaultConfirmationRoot,
	footer: defaultConfirmationFooter,
	popover: defaultConfirmationPopover,
	title: defaultConfirmationTitle,
	description: defaultConfirmationDescription
};

export type ConfirmationTheme = typeof confirmationTheme;
export type ConfirmationThemeProps = InferComponentTheme<ConfirmationTheme>;
export const setConfirmationTheme = setComponentTheme<ConfirmationTheme>('confirmation');
export const useConfirmationTheme = useComponentTheme<ConfirmationTheme>(
	'confirmation',
	confirmationTheme
);
