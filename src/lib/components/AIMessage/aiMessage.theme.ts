import {
	cva,
	setComponentTheme,
	useComponentTheme,
	type InferComponentTheme
} from '$lib/utils/cva/index.js';
const defaultRoot = cva({
	base: 'group/message flex w-full min-w-0 gap-lg',
	variants: {
		role: {
			user: 'justify-end',
			assistant: 'justify-start',
			system: 'justify-center',
			tool: 'justify-start'
		},
		size: {
			small: 'py-sm',
			normal: 'py-md',
			large: 'py-md'
		}
	},
	defaultVariants: { role: 'assistant', size: 'normal' }
});
const defaultBody = cva({
	base: 'relative flex min-w-0 max-w-[min(38rem,82%)] flex-col',
	variants: {
		role: {
			user: 'items-end',
			assistant: 'items-start',
			system: 'max-w-full items-center',
			tool: 'w-full max-w-full items-start'
		},
		size: {
			small: 'gap-micro',
			normal: 'gap-xs',
			large: 'gap-sm'
		},
		variant: {
			bubble: null,
			minimal: null
		}
	},
	compoundVariants: [
		{
			role: 'assistant',
			variant: 'minimal',
			class: 'max-w-[min(44rem,100%)]'
		}
	],
	defaultVariants: { role: 'assistant', size: 'normal', variant: 'bubble' }
});
const defaultHeader = cva({
	base: 'px-xs font-medium text-neutral/55',
	variants: {
		size: {
			small: 'text-[0.6875rem]',
			normal: 'text-xs',
			large: 'text-sm'
		}
	},
	defaultVariants: { size: 'normal' }
});
const defaultBubble = cva({
	base: 'min-w-0 max-w-full break-words [&_*:first-child]:mt-0 [&_*:last-child]:mb-0',
	variants: {
		role: {
			user: 'rounded-lg rounded-br-sm',
			assistant: 'rounded-lg rounded-bl-sm bg-neutral-muted text-neutral',
			system:
				'rounded-sm border border-neutral-muted bg-surface text-neutral/70 [&_*]:!text-neutral/70',
			tool: 'w-full max-w-none rounded-lg rounded-bl-sm bg-neutral-muted text-neutral'
		},
		size: {
			small: 'px-lg py-md text-xs leading-normal',
			normal: 'px-xl py-md text-sm leading-relaxed',
			large: 'px-layout-sm py-lg text-base leading-relaxed'
		},
		variant: {
			bubble: null,
			minimal: null
		}
	},
	compoundVariants: [
		{
			role: 'user',
			variant: 'bubble',
			class:
				'bg-primary text-primary-contrast [&_*]:!text-primary-contrast [&_code]:!bg-primary-contrast/15'
		},
		{
			role: 'user',
			variant: 'minimal',
			class: 'bg-neutral-muted text-neutral [&_*]:!text-neutral [&_code]:!bg-neutral/10'
		},
		{ role: 'system', size: 'small', class: 'px-md py-xs !text-[0.6875rem]' },
		{ role: 'system', size: 'normal', class: 'px-lg py-sm !text-xs' },
		{ role: 'system', size: 'large', class: 'px-xl py-md !text-sm' },
		{
			role: ['assistant', 'tool'],
			variant: 'minimal',
			class: 'rounded-none bg-transparent p-0'
		}
	],
	defaultVariants: { role: 'assistant', size: 'normal', variant: 'bubble' }
});
const defaultMarkdown = cva({
	base: 'min-w-0',
	variants: {
		size: {
			small: '!text-xs !leading-normal',
			normal: '',
			large: ''
		}
	},
	defaultVariants: { size: 'normal' }
});
const defaultFiles = cva({ base: 'max-w-full min-w-0' });
const defaultActions = cva({
	base: 'absolute left-0 top-full z-10 w-full transition-opacity motion-reduce:transition-none',
	variants: {
		visibility: {
			hover:
				'pointer-events-none opacity-0 group-hover/message:pointer-events-auto group-hover/message:opacity-100 group-focus-within/message:pointer-events-auto group-focus-within/message:opacity-100',
			always: 'opacity-100',
			none: 'hidden'
		}
	},
	defaultVariants: { visibility: 'hover' }
});
export const aiMessageTheme = {
	root: defaultRoot,
	body: defaultBody,
	header: defaultHeader,
	bubble: defaultBubble,
	markdown: defaultMarkdown,
	files: defaultFiles,
	actions: defaultActions
};
export type AIMessageTheme = typeof aiMessageTheme;
export type AIMessageThemeProps = InferComponentTheme<AIMessageTheme>;
export const setAIMessageTheme = setComponentTheme<AIMessageTheme>('aiMessage');
export const useAIMessageTheme = useComponentTheme<AIMessageTheme>('aiMessage', aiMessageTheme);
