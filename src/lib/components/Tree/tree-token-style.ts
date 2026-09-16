const treeTokenDeclarations = [
	['--trees-bg-override', 'var(--color-surface)'],
	['--trees-fg-override', 'var(--color-neutral)'],
	['--trees-fg-muted-override', 'var(--color-neutral-muted)'],
	['--trees-bg-muted-override', 'var(--color-neutral-muted)'],
	['--trees-accent-override', 'var(--color-primary)'],
	['--trees-search-fg-override', 'var(--color-neutral)'],
	['--trees-search-bg-override', 'var(--color-surface-raised)'],
	['--trees-border-color-override', 'var(--color-neutral-muted)'],
	['--trees-selected-fg-override', 'var(--color-muted-readable)'],
	['--trees-selected-bg-override', 'var(--color-muted)'],
	[
		'--trees-selected-border-color-override',
		'color-mix(in oklab, var(--color-primary) 55%, var(--color-neutral-muted))'
	],
	['--trees-selected-focused-border-color-override', 'var(--color-primary)'],
	['--trees-focus-ring-color-override', 'var(--color-primary)'],
	['--trees-status-added-override', 'var(--color-success)'],
	['--trees-status-ignored-override', 'var(--color-neutral-muted)'],
	['--trees-status-modified-override', 'var(--color-warning)'],
	['--trees-status-renamed-override', 'var(--color-info)'],
	['--trees-status-untracked-override', 'var(--color-success)'],
	['--trees-status-deleted-override', 'var(--color-danger)']
] as const;

const treeTokenStyle = treeTokenDeclarations
	.map(([property, value]) => `${property}:${value}`)
	.join(';');

export function createTreeStyle(style?: string | null): string {
	return [treeTokenStyle, style]
		.filter((declaration) => declaration != null && declaration.trim().length > 0)
		.join(';');
}
