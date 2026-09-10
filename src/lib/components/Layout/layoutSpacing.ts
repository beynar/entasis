export type LayoutSpacing = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type LayoutSpacingKey = LayoutSpacing;

const spacingValues = {
	none: {
		gap: 'gap-0',
		rowGap: 'gap-y-0',
		columnGap: 'gap-x-0',
		paddingInline: 'px-0',
		paddingBlock: 'py-0',
		css: '0px'
	},
	xs: {
		gap: 'gap-xs',
		rowGap: 'gap-y-xs',
		columnGap: 'gap-x-xs',
		paddingInline: 'px-xs',
		paddingBlock: 'py-xs',
		css: 'var(--space-xs)'
	},
	sm: {
		gap: 'gap-sm',
		rowGap: 'gap-y-sm',
		columnGap: 'gap-x-sm',
		paddingInline: 'px-sm',
		paddingBlock: 'py-sm',
		css: 'var(--space-sm)'
	},
	md: {
		gap: 'gap-md',
		rowGap: 'gap-y-md',
		columnGap: 'gap-x-md',
		paddingInline: 'px-md',
		paddingBlock: 'py-md',
		css: 'var(--space-md)'
	},
	lg: {
		gap: 'gap-lg',
		rowGap: 'gap-y-lg',
		columnGap: 'gap-x-lg',
		paddingInline: 'px-lg',
		paddingBlock: 'py-lg',
		css: 'var(--space-lg)'
	},
	xl: {
		gap: 'gap-xl',
		rowGap: 'gap-y-xl',
		columnGap: 'gap-x-xl',
		paddingInline: 'px-xl',
		paddingBlock: 'py-xl',
		css: 'var(--space-xl)'
	}
} as const satisfies Record<
	LayoutSpacingKey,
	{
		gap: string;
		rowGap: string;
		columnGap: string;
		paddingInline: string;
		paddingBlock: string;
		css: string;
	}
>;

const selectSpacingValues = <Key extends keyof (typeof spacingValues)[LayoutSpacingKey]>(
	key: Key
) =>
	Object.fromEntries(
		Object.entries(spacingValues).map(([spacing, values]) => [spacing, values[key]])
	) as Record<LayoutSpacingKey, (typeof spacingValues)[LayoutSpacingKey][Key]>;

export const layoutGapClasses = selectSpacingValues('gap');
export const layoutRowGapClasses = selectSpacingValues('rowGap');
export const layoutColumnGapClasses = selectSpacingValues('columnGap');
export const layoutPaddingInlineClasses = selectSpacingValues('paddingInline');
export const layoutPaddingBlockClasses = selectSpacingValues('paddingBlock');
export const layoutSpacingCssValues = selectSpacingValues('css');

export const toLayoutSpacingKey = (spacing: LayoutSpacing): LayoutSpacingKey => spacing;
