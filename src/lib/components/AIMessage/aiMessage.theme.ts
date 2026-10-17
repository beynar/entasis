import {
	cva,
	setComponentTheme,
	useComponentTheme,
	type InferComponentTheme
} from '$lib/utils/cva/index.js';
// The root is an inline-size container: a message lays out from the width it is given (a narrow
// thread on a phone, a wide one beside a table of contents), not from the viewport.
const defaultRoot = cva({
	base: 'group/message @container/message flex w-full min-w-0 gap-lg',
	variants: {
		role: {
			user: 'justify-end',
			assistant: 'justify-start',
			system: 'justify-center',
			tool: 'justify-start'
		},
		size: {
			small: 'py-xs',
			normal: 'py-sm',
			large: 'py-md'
		}
	},
	defaultVariants: { role: 'assistant', size: 'normal' }
});
// Bubbles keep a reading cap of 38rem / 82% of the message, but only once the message is at
// least 24rem wide: a narrow column gives a bubble its full width instead of squeezing it.
const defaultBody = cva({
	base: 'relative flex max-w-full min-w-0 flex-col @sm/message:max-w-[min(38rem,82%)]',
	variants: {
		role: {
			user: 'items-end',
			assistant: 'items-start',
			system: 'max-w-full items-center @sm/message:max-w-full',
			tool: 'w-full max-w-full items-start @sm/message:max-w-full'
		},
		size: {
			small: 'gap-micro',
			normal: 'gap-micro',
			large: 'gap-xs'
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
			class: 'w-full @sm/message:max-w-full'
		}
	],
	defaultVariants: { role: 'assistant', size: 'normal', variant: 'minimal' }
});
const defaultHeader = cva({
	base: 'px-xs font-medium text-neutral/70',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-xs',
			large: 'text-xs'
		}
	},
	defaultVariants: { size: 'normal' }
});
// Chat prose is a reading surface: `normal` sets 14px with a 1.625 line height (`large` 16px,
// `small` 12px). Bubble tails sit on logical corners so they follow the writing direction.
const defaultBubble = cva({
	base: 'min-w-0 max-w-full break-words [&_*:first-child]:mt-0 [&_*:last-child]:mb-0',
	variants: {
		role: {
			user: 'rounded-lg rounded-ee-sm',
			assistant: 'rounded-lg rounded-es-sm bg-neutral-muted text-neutral',
			system:
				'rounded-sm border border-neutral-muted bg-surface text-neutral/70 [&_*]:!text-neutral/70',
			tool: 'w-full max-w-none rounded-lg rounded-es-sm bg-neutral-muted text-neutral'
		},
		size: {
			small: 'px-md py-xs text-xs leading-relaxed',
			normal: 'px-lg py-sm text-sm leading-relaxed',
			large: 'px-xl py-md text-base leading-relaxed'
		},
		variant: {
			bubble: null,
			minimal: null
		},
		// The user bubble's colour. Neutral is a quiet grey bubble; every other role is solid.
		color: {
			primary: null,
			secondary: null,
			neutral: null,
			danger: null,
			success: null,
			warning: null,
			info: null
		}
	},
	compoundVariants: [
		{
			role: 'user',
			color: 'neutral',
			class: 'bg-neutral-muted text-neutral [&_*]:!text-neutral [&_code]:!bg-neutral/10'
		},
		{
			role: 'user',
			color: 'primary',
			class:
				'bg-primary text-primary-contrast [&_*]:!text-primary-contrast [&_code]:!bg-primary-contrast/15'
		},
		{
			role: 'user',
			color: 'secondary',
			class:
				'bg-secondary text-secondary-contrast [&_*]:!text-secondary-contrast [&_code]:!bg-secondary-contrast/15'
		},
		{
			role: 'user',
			color: 'danger',
			class:
				'bg-danger text-danger-contrast [&_*]:!text-danger-contrast [&_code]:!bg-danger-contrast/15'
		},
		{
			role: 'user',
			color: 'success',
			class:
				'bg-success text-success-contrast [&_*]:!text-success-contrast [&_code]:!bg-success-contrast/15'
		},
		{
			role: 'user',
			color: 'warning',
			class:
				'bg-warning text-warning-contrast [&_*]:!text-warning-contrast [&_code]:!bg-warning-contrast/15'
		},
		{
			role: 'user',
			color: 'info',
			class: 'bg-info text-info-contrast [&_*]:!text-info-contrast [&_code]:!bg-info-contrast/15'
		},
		{ role: 'system', size: 'small', class: 'px-sm py-micro !text-xs' },
		{ role: 'system', size: 'normal', class: 'px-md py-xs !text-xs' },
		{ role: 'system', size: 'large', class: 'px-lg py-sm !text-xs' },
		{
			role: ['assistant', 'tool'],
			variant: 'minimal',
			class: 'rounded-none bg-transparent p-0'
		}
	],
	defaultVariants: { role: 'assistant', size: 'normal', variant: 'minimal', color: 'neutral' }
});
// Markdown inherits the bubble's type size and leading, and headings stay close to the body
// (h2 about 1.25x) instead of the Markdown component's document scale.
const defaultMarkdown = cva({
	base: 'min-w-0 !text-[length:inherit] !leading-[inherit]',
	variants: {
		size: {
			small: '[&_h1]:!text-base [&_h2]:!text-sm [&_:is(h3,h4,h5,h6)]:!text-xs',
			normal: '[&_h1]:!text-lg [&_h2]:!text-base [&_:is(h3,h4,h5,h6)]:!text-sm',
			large: '[&_h1]:!text-xl [&_h2]:!text-lg [&_:is(h3,h4,h5,h6)]:!text-base'
		}
	},
	defaultVariants: { size: 'normal' }
});
const defaultFiles = cva({ base: 'max-w-full min-w-0' });
// The streaming caret: a small pulsing dot after the content, like Claude.ai and ChatGPT.
const defaultCaret = cva({
	base: 'mt-xs inline-block size-2.5 shrink-0 rounded-full bg-current opacity-70 motion-safe:animate-pulse'
});
// Actions sit in the flow under the content and keep their row's height when hover-hidden, so
// the next row never draws under them. The row sizes to its buttons (AIMessageActions), never to
// the bubble, so it does not wrap under a one-word message.
const defaultActions = cva({
	base: '',
	variants: {
		visibility: {
			hover: null,
			always: null,
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
	caret: defaultCaret,
	actions: defaultActions
};
export type AIMessageTheme = typeof aiMessageTheme;
export type AIMessageThemeProps = InferComponentTheme<AIMessageTheme>;
export const setAIMessageTheme = setComponentTheme<AIMessageTheme>('ai-message');
export const useAIMessageTheme = useComponentTheme<AIMessageTheme>('ai-message', aiMessageTheme);
