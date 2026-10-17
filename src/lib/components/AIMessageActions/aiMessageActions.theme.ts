import {
	cva,
	setComponentTheme,
	useComponentTheme,
	type InferComponentTheme
} from '$lib/utils/cva/index.js';
// The action row takes layout space (it is never positioned over the next row) and its ghost
// buttons are pulled out by their own inset, so the first icon lines up with the edge of the text
// or bubble above: the start edge for assistant rows, the end edge for user rows. The row is as wide
// as its buttons and never wraps, whatever the width of a short bubble above it.
const defaultRoot = cva({
	base: 'flex min-h-[var(--control-height-sm)] w-max max-w-none shrink-0 flex-nowrap items-center gap-xs transition-opacity motion-reduce:transition-none',
	variants: {
		role: {
			user: 'ms-auto justify-end',
			assistant: 'justify-start',
			system: 'mx-auto justify-center',
			tool: 'justify-start'
		},
		visibility: {
			// Revealed by hovering or focusing the row or its message; a touch screen cannot hover,
			// so there the row always shows.
			hover:
				'opacity-0 group-hover/message:opacity-100 group-focus-within/message:opacity-100 hover:opacity-100 focus-within:opacity-100 pointer-coarse:opacity-100',
			always: 'opacity-100',
			none: 'hidden'
		},
		size: {
			small: 'min-h-6 gap-micro',
			normal: 'min-h-[var(--control-height-sm)] gap-xs',
			large: 'min-h-[var(--control-height-md)] gap-sm'
		}
	},
	compoundVariants: [
		{
			role: ['assistant', 'tool'],
			size: 'small',
			class: '-ms-[calc((var(--spacing)*6-0.75rem)/2)]'
		},
		{
			role: ['assistant', 'tool'],
			size: 'normal',
			class: '-ms-[calc((var(--control-height-sm)-0.875rem)/2)]'
		},
		{
			role: ['assistant', 'tool'],
			size: 'large',
			class: '-ms-[calc((var(--control-height-md)-1.125rem)/2)]'
		},
		{ role: 'user', size: 'small', class: '-me-[calc((var(--spacing)*6-0.75rem)/2)]' },
		{ role: 'user', size: 'normal', class: '-me-[calc((var(--control-height-sm)-0.875rem)/2)]' },
		{ role: 'user', size: 'large', class: '-me-[calc((var(--control-height-md)-1.125rem)/2)]' }
	],
	defaultVariants: { role: 'assistant', visibility: 'always', size: 'normal' }
});
const defaultButton = cva({
	base: 'text-neutral/70 hover:text-neutral',
	variants: {
		size: {
			small: '!h-6 [&_svg]:!size-3',
			normal: '',
			large: '[&_svg]:!size-[1.125rem]'
		}
	},
	defaultVariants: { size: 'normal' }
});
// Rendered after the row, not inside it, so a message never widens or wraps the button row.
const defaultError = cva({ base: 'w-full min-w-0 pt-xs' });
export const aiMessageActionsTheme = {
	root: defaultRoot,
	button: defaultButton,
	error: defaultError
};
export type AIMessageActionsTheme = typeof aiMessageActionsTheme;
export type AIMessageActionsThemeProps = InferComponentTheme<AIMessageActionsTheme>;
export const setAIMessageActionsTheme =
	setComponentTheme<AIMessageActionsTheme>('ai-message-actions');
export const useAIMessageActionsTheme = useComponentTheme<AIMessageActionsTheme>(
	'ai-message-actions',
	aiMessageActionsTheme
);
