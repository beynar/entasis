import type { ChartChannel, ChartColor, ChartKey, ChartRequiredChannel } from './chart.core.js';

export type ChartRelationVariant = 'network' | 'tree' | 'sankey';

export type ChartRelationLink = Readonly<{
	target: ChartKey;
	value?: number;
	group?: ChartKey;
}>;

export type ChartWeightedRelationLink = Readonly<{
	target: ChartKey;
	value: number;
	group?: ChartKey;
}>;

export type ChartRelationNodeStyle = {
	fill?: ChartColor;
	fillOpacity?: number;
	stroke?: ChartColor;
	strokeWidth?: number;
};

export type ChartRelationLinkStyle = {
	stroke?: ChartColor;
	strokeOpacity?: number;
};

export type ChartRelationLabelOptions<TRow> = {
	text?: ChartChannel<TRow, string | number>;
	color?: ChartColor;
	fontSize?: number;
	fontWeight?: number;
};

type ChartRelationBase<TRow> = {
	type: 'relation';
	id?: string;
	nodeId: ChartRequiredChannel<TRow, ChartKey>;
	colorBy?: ChartChannel<TRow, ChartKey>;
	labels?: boolean | ChartRelationLabelOptions<TRow>;
	nodes?: ChartRelationNodeStyle;
	links?: ChartRelationLinkStyle;
};

export type ChartTreeRelationMark<TRow> = ChartRelationBase<TRow> & {
	variant: 'tree';
	parent: ChartChannel<TRow, ChartKey>;
	orientation?: 'horizontal' | 'vertical';
	nodeRadius?: number;
	relations?: never;
	align?: never;
	nodeWidth?: never;
	nodeGap?: never;
};

export type ChartNetworkRelationMark<TRow> = ChartRelationBase<TRow> & {
	variant: 'network';
	relations: ChartRequiredChannel<TRow, readonly ChartRelationLink[]>;
	nodeRadius?: number;
	parent?: never;
	orientation?: never;
	align?: never;
	nodeWidth?: never;
	nodeGap?: never;
};

export type ChartSankeyRelationMark<TRow> = ChartRelationBase<TRow> & {
	variant: 'sankey';
	relations: ChartRequiredChannel<TRow, readonly ChartWeightedRelationLink[]>;
	align?: 'left' | 'right' | 'center' | 'justify';
	nodeWidth?: number;
	nodeGap?: number;
	nodeRadius?: number;
	parent?: never;
	orientation?: never;
};

export type ChartRelationMark<TRow> =
	ChartTreeRelationMark<TRow> | ChartNetworkRelationMark<TRow> | ChartSankeyRelationMark<TRow>;
