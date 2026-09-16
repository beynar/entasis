import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

const defaultCode = cva({
	// `group` + `relative` support the floating copy button on headerless blocks.
	base: 'group relative my-xl flex w-full flex-col overflow-hidden rounded-lg border border-neutral-muted bg-surface'
});

// Floating copy button for headerless blocks: top-right, revealed on hover/focus.
const defaultCodeFloatingCopy = cva({
	base: 'absolute top-2 right-2 z-10 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100'
});

const defaultCodeHeader = cva({
	base: 'flex items-center justify-between gap-md border-b border-neutral-muted bg-surface-raised px-lg py-sm text-xs text-neutral/70'
});

const defaultCodeTitle = cva({
	base: 'font-mono'
});

const defaultCodeContainer = cva({
	// The scroll + padding live on the inner highlighter <pre> (classes added by codeToHtml)
	// so the focusable node is the scroller; the container is just the surface. `tab-size` is
	// driven by a CSS var set on the root (defaults to 2).
	base: 'min-w-0 bg-surface text-sm [&_pre]:!bg-transparent [&_pre]:[tab-size:var(--code-tab-size,2)] [&_code]:font-mono'
});

const defaultCodeFooter = cva({
	base: 'flex items-center justify-between gap-md border-t border-neutral-muted bg-surface-raised px-lg py-sm text-xs text-neutral/70'
});

export const codeTheme = {
	root: defaultCode,
	header: defaultCodeHeader,
	title: defaultCodeTitle,
	container: defaultCodeContainer,
	footer: defaultCodeFooter,
	floatingCopy: defaultCodeFloatingCopy
};

export type CodeTheme = typeof codeTheme;
export type CodeThemeProps = InferComponentTheme<CodeTheme>;
export const setCodeTheme = setComponentTheme<CodeTheme>('code');
export const useCodeTheme = useComponentTheme<CodeTheme>('code', codeTheme);
