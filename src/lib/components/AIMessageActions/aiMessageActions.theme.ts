import {
	cva,
	setComponentTheme,
	useComponentTheme,
	type InferComponentTheme
} from '$lib/utils/cva/index.js';
const defaultRoot = cva({
	base: 'flex min-h-[var(--control-height-sm)] w-full flex-wrap items-center gap-xs px-xs transition-opacity motion-reduce:transition-none',
	variants: {
		role: {
			user: 'justify-end',
			assistant: 'justify-start',
			system: 'justify-center',
			tool: 'justify-start'
		},
		visibility: {
			hover:
				'opacity-0 group-hover/message:opacity-100 group-focus-within/message:opacity-100 hover:opacity-100 focus-within:opacity-100',
			always: 'opacity-100',
			none: 'hidden'
		},
		size: {
			small: 'min-h-6 gap-micro px-micro',
			normal: 'min-h-[var(--control-height-sm)] gap-xs px-xs',
			large: 'min-h-[var(--control-height-md)] gap-sm px-xs'
		}
	},
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
const defaultError = cva({ base: 'w-full basis-full pt-xs' });
export const aiMessageActionsTheme = {
	root: defaultRoot,
	button: defaultButton,
	error: defaultError
};
export type AIMessageActionsTheme = typeof aiMessageActionsTheme;
export type AIMessageActionsThemeProps = InferComponentTheme<AIMessageActionsTheme>;
export const setAIMessageActionsTheme =
	setComponentTheme<AIMessageActionsTheme>('aiMessageActions');
export const useAIMessageActionsTheme = useComponentTheme<AIMessageActionsTheme>(
	'aiMessageActions',
	aiMessageActionsTheme
);
