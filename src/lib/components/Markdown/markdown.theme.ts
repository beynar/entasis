import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import type { StreamdownProps } from 'svelte-streamdown';
import type { MarkdownSize } from './markdown.props.js';

// The root wrapper part. Owns the overall type/spacing scale for the rendered
// markdown; the size variant is echoed into `buildStreamdownTheme` so every
// child element scales in sync.
const defaultMarkdownRoot = cva({
	base: 'w-full min-w-0',
	variants: {
		size: {
			small: 'text-sm leading-normal',
			normal: 'text-[0.9375rem] leading-relaxed',
			large: 'text-base leading-relaxed'
		}
	},
	defaultVariants: { size: 'normal' }
});

export const markdownTheme = {
	root: defaultMarkdownRoot
};

export type MarkdownTheme = typeof markdownTheme;
export type MarkdownThemeProps = InferComponentTheme<MarkdownTheme>;
export const setMarkdownTheme = setComponentTheme<MarkdownTheme>('markdown');
export const useMarkdownTheme = useComponentTheme('markdown', markdownTheme);

/**
 * Wrapper classes applied to the svelai `Code` block per size (margin + type
 * scale). The `Markdown` component overrides the streamdown `code` renderer with
 * a svelai `Code` snippet, so these drive the fenced-code-block spacing.
 */
export const markdownCodeSizes: Record<MarkdownSize, string> = {
	small: 'my-md text-xs',
	normal: 'my-lg text-sm',
	large: 'my-xl text-sm'
};

/**
 * Maps the markdown size scale onto the svelai `Mermaid` component's own size
 * scale (used when the `mermaid` renderer is overridden with a svelai Mermaid).
 */
export const markdownMermaidSizes: Record<MarkdownSize, 'small' | 'normal' | 'large'> = {
	small: 'small',
	normal: 'normal',
	large: 'large'
};

// ---------------------------------------------------------------------------
// Per-size lookup scales used to template the streamdown theme once below.
// ---------------------------------------------------------------------------

type SizeScale = {
	// Heading font sizes h1..h6.
	h1: string;
	h2: string;
	h3: string;
	h4: string;
	h5: string;
	h6: string;
	// Vertical margin applied to headings.
	headingMargin: string;
	// Vertical margin applied to block-level elements (blockquote, table, code…).
	blockMargin: string;
	// List left padding / indentation.
	listIndent: string;
	// Vertical padding on each list item.
	listItemPad: string;
	// Small text scale for codespan, table cells, alert text, sup/sub.
	smallText: string;
	// Blockquote / horizontal-rule spacing.
	ruleMargin: string;
};

const SIZES: Record<MarkdownSize, SizeScale> = {
	small: {
		h1: 'text-xl',
		h2: 'text-lg',
		h3: 'text-base',
		h4: 'text-sm',
		h5: 'text-sm',
		h6: 'text-sm',
		headingMargin: 'mt-xl mb-sm',
		blockMargin: 'my-md',
		listIndent: 'ml-lg',
		listItemPad: 'py-0',
		smallText: 'text-xs',
		ruleMargin: 'my-xl'
	},
	normal: {
		h1: 'text-2xl',
		h2: 'text-xl',
		h3: 'text-lg',
		h4: 'text-base',
		h5: 'text-sm',
		h6: 'text-sm',
		headingMargin: 'mt-layout-sm mb-md',
		blockMargin: 'my-lg',
		listIndent: 'ml-xl',
		listItemPad: 'py-micro',
		smallText: 'text-sm',
		ruleMargin: 'my-layout-sm'
	},
	large: {
		h1: 'text-3xl',
		h2: 'text-2xl',
		h3: 'text-xl',
		h4: 'text-lg',
		h5: 'text-base',
		h6: 'text-base',
		headingMargin: 'mt-layout-md mb-md',
		blockMargin: 'my-xl',
		listIndent: 'ml-layout-sm',
		listItemPad: 'py-micro',
		smallText: 'text-sm',
		ruleMargin: 'my-layout-md'
	}
};

/**
 * The full shadcn base theme from `svelte-streamdown`, translated to svelai
 * semantic tokens and scaled to the given markdown `size`. Passed to
 * `<Streamdown theme={...}>`; it deep-merges over the built-in `tailwind` base
 * theme, so any key omitted here still falls back safely.
 */
export const buildStreamdownTheme = (size: MarkdownSize): StreamdownProps['theme'] => {
	const s = SIZES[size];

	return {
		link: {
			base: 'text-primary-readable wrap-anywhere font-medium underline hover:text-primary-readable/80',
			blocked: 'text-neutral/60'
		},
		h1: {
			base: `${s.headingMargin} ${s.h1} font-semibold text-neutral`
		},
		h2: {
			base: `${s.headingMargin} ${s.h2} font-semibold text-neutral`
		},
		h3: {
			base: `${s.headingMargin} ${s.h3} font-semibold text-neutral`
		},
		h4: {
			base: `${s.headingMargin} ${s.h4} font-semibold text-neutral`
		},
		h5: {
			base: `${s.headingMargin} ${s.h5} font-semibold text-neutral`
		},
		h6: {
			base: `${s.headingMargin} ${s.h6} font-semibold text-neutral`
		},
		paragraph: {
			base: `${s.blockMargin} text-neutral`
		},
		ul: {
			base: `${s.listIndent} list-inside list-disc whitespace-normal text-neutral`
		},
		ol: {
			base: `${s.listIndent} list-inside whitespace-normal text-neutral`
		},
		li: {
			base: s.listItemPad,
			checkbox: ' mr-md'
		},
		code: {
			base: `${s.blockMargin} w-full overflow-hidden rounded-md border border-neutral-muted bg-surface flex flex-col`,
			container: 'relative overflow-visible bg-surface p-md font-mono text-sm',
			header: `flex items-center justify-between bg-surface-raised px-md py-xs text-neutral/60 ${s.smallText}`,
			buttons: 'flex items-center gap-md',
			language: 'ml-xs font-mono lowercase',
			skeleton:
				'block rounded-sm font-mono text-transparent bg-neutral-muted/80 scale-y-90 w-fit animate-pulse whitespace-nowrap',
			pre: 'overflow-x-auto font-mono p-0 bg-surface',
			line: 'block '
		},
		codespan: {
			base: `bg-surface-raised rounded-sm px-sm py-micro font-mono text-neutral ${s.smallText}`
		},
		image: {
			base: `group relative ${s.blockMargin} mx-auto w-fit block`,
			image: 'max-w-full rounded-md'
		},
		blockquote: {
			base: `border-neutral/30 text-neutral/60 ${s.blockMargin} border-l-4 pl-xl italic`
		},
		alert: {
			base: `relative ${s.blockMargin} border-l-4 p-xl bg-surface-raised`,
			title: `${s.smallText} font-semibold flex items-center gap-md mb-md capitalize`,
			icon: 'size-5',
			note: '[&>[data-alert-title]]:text-info-muted-readable border-info/40 stroke-info bg-info-muted',
			tip: '[&>[data-alert-title]]:text-success-muted-readable border-success/40 stroke-success bg-success-muted',
			warning:
				'[&>[data-alert-title]]:text-warning-muted-readable border-warning/40 stroke-warning bg-warning-muted',
			caution:
				'[&>[data-alert-title]]:text-danger-muted-readable border-danger/40 stroke-danger bg-danger-muted',
			important:
				'[&>[data-alert-title]]:text-primary-muted-readable border-primary/40 stroke-primary bg-primary-muted'
		},
		table: {
			base: `overflow-x-auto max-w-full ${s.blockMargin} rounded-md border border-neutral-muted`,
			table: 'w-full border-collapse min-w-full'
		},
		thead: {
			base: 'bg-surface-raised'
		},
		tbody: {
			base: ''
		},
		tfoot: {
			base: 'bg-surface-raised border-t border-neutral-muted'
		},
		tr: {
			base: 'state-layer border-neutral-muted not-last:border-b transition-colors'
		},
		td: {
			base: `px-xl py-lg ${s.smallText} text-neutral min-w-[200px] max-w-[400px] break-words`
		},
		th: {
			base: `px-xl py-lg ${s.smallText} text-neutral min-w-[200px] max-w-[400px] break-words`
		},
		sup: {
			base: s.smallText
		},
		sub: {
			base: s.smallText
		},
		hr: {
			base: `border-neutral-muted ${s.ruleMargin}`
		},
		strong: {
			base: 'font-semibold text-neutral'
		},
		mermaid: {
			base: `group relative ${s.blockMargin} h-auto rounded-md border border-neutral-muted bg-surface-raised overflow-hidden items-center min-h-[500px]`,
			icon: 'size-5',
			buttons: 'absolute right-1 top-1 flex h-fit w-fit items-center gap-xs'
		},
		math: {
			block: 'text-neutral',
			inline: 'text-neutral'
		},
		br: {
			base: ''
		},
		em: {
			base: 'italic'
		},
		del: {
			base: 'text-neutral/60'
		},
		footnoteRef: {
			base: `state-layer text-neutral/60 ${s.smallText} rounded-full bg-neutral-muted cursor-pointer border border-neutral-muted tabular-nums min-w-5 min-h-5 outline-none focus:ring-1 focus:ring-primary`
		},
		descriptionList: {
			base: `${s.blockMargin} space-y-2`
		},
		descriptionTerm: {
			base: 'font-semibold text-neutral border-l-2 border-neutral-muted pl-xl'
		},
		descriptionDetail: {
			base: 'text-neutral/60 ml-xl leading-relaxed'
		},
		inlineCitation: {
			preview: `state-layer ${s.smallText} text-neutral/60 bg-neutral-muted rounded-sm px-md py-micro cursor-pointer inline-flex border border-neutral-muted outline-none focus:ring-1 focus:ring-primary`,
			carousel: {
				header: 'flex items-center justify-between',
				stepCounter: 'h-fit text-xs font-semibold text-neutral/60 tabular-nums',
				buttons: 'flex w-fit items-center justify-end gap-md',
				title: 'mb-md line-clamp-2 font-semibold',
				url: 'flex items-center gap-md text-sm text-neutral/60',
				favicon: 'h-4 w-4 rounded-sm'
			},
			list: {
				base: 'grid gap-md',
				item: 'state-layer grid gap-xs rounded-sm p-md',
				title: 'line-clamp-1 font-semibold text-sm',
				url: 'flex items-center gap-md text-xs text-neutral/60',
				favicon: 'h-3 w-3 rounded-sm'
			}
		},
		components: {
			button:
				'state-layer disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer p-xs text-neutral/60 transition-all hover:text-neutral rounded-sm flex items-center justify-center w-6 h-6',
			popover:
				'min-w-[250px] max-w-md fixed z-[1000] max-h-md overflow-y-auto rounded-md bg-surface-floating border border-neutral-muted p-md shadow'
		}
	};
};
