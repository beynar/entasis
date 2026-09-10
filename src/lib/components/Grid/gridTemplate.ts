import type { LayoutSpacing } from '../Layout/layoutSpacing.js';
import { layoutSpacingCssValues, toLayoutSpacingKey } from '../Layout/layoutSpacing.js';
import type { GridColumns } from './grid.props.js';

const positiveInteger = (value: number | undefined): number | undefined => {
	if (value === undefined || !Number.isFinite(value)) return undefined;
	const integer = Math.floor(value);
	return integer > 0 ? integer : undefined;
};

const minimumWidth = (value: number): number => (Number.isFinite(value) ? Math.max(0, value) : 0);

const cappedTemplate = (
	minWidth: number,
	maxColumns: number,
	repeatMode: 'auto-fill' | 'auto-fit',
	columnGap: LayoutSpacing
) => {
	const gap = layoutSpacingCssValues[toLayoutSpacingKey(columnGap)];
	const availableWidth =
		columnGap === 'none'
			? `calc(100% / ${maxColumns})`
			: `calc((100% - ${maxColumns - 1} * ${gap}) / ${maxColumns})`;
	const trackMinimum = `min(100%, max(${minWidth}px, ${availableWidth}))`;
	return `repeat(${repeatMode}, minmax(${trackMinimum}, 1fr))`;
};

export const getGridTemplate = (columns: GridColumns, columnGap: LayoutSpacing): string => {
	if (typeof columns === 'number') {
		const count = positiveInteger(columns) ?? 1;
		return count === 1 ? '1fr' : `repeat(${count}, minmax(0, 1fr))`;
	}

	const repeatMode = columns.repeat === 'fit' ? 'auto-fit' : 'auto-fill';
	const minWidth = minimumWidth(columns.minWidth);
	const maxColumns = positiveInteger(columns.max);

	if (maxColumns) return cappedTemplate(minWidth, maxColumns, repeatMode, columnGap);
	return `repeat(${repeatMode}, minmax(min(100%, ${minWidth}px), 1fr))`;
};
