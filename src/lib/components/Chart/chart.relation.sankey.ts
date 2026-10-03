import { d3Curve, link, rect, text } from '@tanstack/charts';
import {
	sankey,
	sankeyCenter,
	sankeyJustify,
	sankeyLeft,
	sankeyRight,
	type SankeyLink,
	type SankeyNode
} from 'd3-sankey';
import { curveBumpX } from 'd3-shape';
import { compileColor } from './chart.channels.js';
import type { CompiledMark } from './chart.cartesian.js';
import type { ChartSankeyRelationMark } from './chart.props.js';
import {
	compileRelationEdges,
	type CompiledRelationData,
	type RelationLinkDatum,
	type RelationNodeDatum,
	type RelationSourceEdge,
	type RelationSourceNode
} from './chart.relation.data.js';
import {
	axisFraction,
	CHART_FIT_MARGIN,
	estimateLabelWidth,
	fitAxis,
	LABEL_LINE_BOX
} from './chart.fit.js';
import { withoutTooltipPoints } from './chart.mark.js';

type SankeySourceNode<TRow> = RelationSourceNode<TRow>;

type SankeySourceLink<TRow> = {
	relation: RelationSourceEdge<TRow>;
};

export function compileSankeyRelation<TRow extends object>(
	data: readonly TRow[],
	mark: ChartSankeyRelationMark<TRow>,
	compiled: CompiledRelationData<TRow>,
	path: string,
	width: number,
	height: number
): readonly CompiledMark[] {
	const relations = compileRelationEdges(data, compiled, mark, path);
	const labels = compiled.labels;
	const nodeWidth = mark.nodeWidth ?? clamp(width * 0.022, 10, 22);
	const nodeGap = mark.nodeGap ?? clamp(height * 0.055, 10, 30);
	const layout = (top: number, bottom: number) =>
		sankey<SankeySourceNode<TRow>, SankeySourceLink<TRow>>()
			.nodeId((node) => node.identity)
			.nodeAlign(resolveAlignment(mark.align))
			.nodeSort((left, right) => left.index - right.index)
			.nodeWidth(nodeWidth)
			.nodePadding(nodeGap)
			.extent([
				[0, top],
				[width, Math.max(top + 1, height - bottom)]
			])
			.iterations(32)({
			nodes: compiled.nodes.map((node) => ({ ...node })),
			links: relations.map((relation) => ({
				source: relation.source.identity,
				target: relation.target.identity,
				value: relation.value ?? 0,
				relation
			}))
		});
	let graph = layout(CHART_FIT_MARGIN, CHART_FIT_MARGIN);
	// Labels are centred on their node, so only a node shorter than a line pushes its label past
	// the plot edge. Lay out again with exactly that overhang reserved.
	const overhang = labelOverhang(graph.nodes, labels, height);
	if (overhang.top > 0.5 || overhang.bottom > 0.5) {
		graph = layout(CHART_FIT_MARGIN + overhang.top, CHART_FIT_MARGIN + overhang.bottom);
	}
	fitColumns(graph.nodes, nodeWidth, labels, width);
	const nodes = graph.nodes.map((node) => compileNode(node, width));
	const links = graph.links.map(compileLink);
	return compileSankeyMarks(nodes, links, mark, compiled.labels, path);
}

function labelOverhang<TRow extends object>(
	nodes: SankeyNode<SankeySourceNode<TRow>, SankeySourceLink<TRow>>[],
	labels: CompiledRelationData<TRow>['labels'],
	height: number
): { top: number; bottom: number } {
	if (!labels.enabled) return { top: 0, bottom: 0 };
	const above = labels.fontSize * LABEL_LINE_BOX.middle.above;
	const below = labels.fontSize * LABEL_LINE_BOX.middle.below;
	let top = 0;
	let bottom = 0;
	for (const node of nodes) {
		const { y0, y1 } = resolveNodeBounds(node);
		const middle = (y0 + y1) / 2;
		top = Math.max(top, CHART_FIT_MARGIN - (middle - above));
		bottom = Math.max(bottom, middle + below - (height - CHART_FIT_MARGIN));
	}
	return { top, bottom };
}

// Columns are placed evenly across the plot, which leaves the outer labels to overflow or, with
// guessed margins, a gap. Re-place them so the widest outer labels reach the plot edges: a
// source's label sits left of its node, every other label to the right.
function fitColumns<TRow extends object>(
	nodes: SankeyNode<SankeySourceNode<TRow>, SankeySourceLink<TRow>>[],
	nodeWidth: number,
	labels: CompiledRelationData<TRow>['labels'],
	width: number
): void {
	const columns = nodes.map((node) => resolveNodeBounds(node).x0);
	const first = Math.min(...columns);
	const last = Math.max(...columns);
	const placed = nodes.map((node, index) => {
		const label = labels.enabled
			? 7 + estimateLabelWidth(node.label, labels.fontSize, labels.fontWeight)
			: 0;
		const labelOnLeft = (node.targetLinks?.length ?? 0) === 0;
		return {
			node,
			fraction: axisFraction(columns[index] ?? first, first, last),
			before: labelOnLeft ? label : 0,
			after: nodeWidth + (labelOnLeft ? 0 : label)
		};
	});
	const fit = fitAxis(placed, width);
	for (const { node, fraction } of placed) {
		node.x0 = fit.start + fraction * fit.span;
		node.x1 = node.x0 + nodeWidth;
	}
}

function compileSankeyMarks<TRow extends object>(
	nodes: readonly RelationNodeDatum<TRow>[],
	links: readonly RelationLinkDatum[],
	mark: ChartSankeyRelationMark<TRow>,
	labels: CompiledRelationData<TRow>['labels'],
	path: string
): readonly CompiledMark[] {
	const linkMark = link(links, {
		id: `${mark.id ?? path}:links`,
		x1: 'x1',
		y1: 'y1',
		x2: 'x2',
		y2: 'y2',
		z: 'group',
		color: 'group',
		key: 'identity',
		stroke: mark.links?.stroke ? compileColor(mark.links.stroke) : undefined,
		strokeOpacity: mark.links?.strokeOpacity ?? 0.42,
		strokeWidth: (relation) => Math.max(1, relation.width ?? 1),
		lineCap: 'butt',
		curve: d3Curve(curveBumpX)
	});
	const nodeMark = rect(nodes, {
		id: `${mark.id ?? path}:nodes`,
		x: 'x',
		y: 'y',
		x1: 'x0',
		x2: 'x1',
		y1: 'y0',
		y2: 'y1',
		z: 'group',
		color: 'group',
		key: 'identity',
		fill: mark.nodes?.fill ? compileColor(mark.nodes.fill) : undefined,
		fillOpacity: mark.nodes?.fillOpacity,
		stroke: mark.nodes?.stroke ? compileColor(mark.nodes.stroke) : undefined,
		strokeWidth: mark.nodes?.strokeWidth,
		radius: mark.nodeRadius
	});
	if (!labels.enabled) return [linkMark, nodeMark];
	const labelMark = text(nodes, {
		id: `${mark.id ?? path}:labels`,
		x: 'labelX',
		y: 'labelY',
		text: 'label',
		color: 'group',
		key: 'identity',
		anchor: (node) => node.labelAnchor ?? 'middle',
		fill: labels.color ? compileColor(labels.color) : undefined,
		fontSize: labels.fontSize,
		fontWeight: labels.fontWeight
	});
	return [linkMark, nodeMark, withoutTooltipPoints(labelMark)];
}

function compileNode<TRow>(
	node: SankeyNode<SankeySourceNode<TRow>, SankeySourceLink<TRow>>,
	width: number
): RelationNodeDatum<TRow> {
	const { x0, x1, y0, y1 } = resolveNodeBounds(node);
	const hasIncoming = (node.targetLinks?.length ?? 0) > 0;
	const labelOnLeft = !hasIncoming;
	return {
		datum: node.datum,
		index: node.index,
		id: node.id,
		identity: node.identity,
		label: node.label,
		group: node.group,
		kind: 'relation-node',
		x: (x0 + x1) / 2,
		y: (y0 + y1) / 2,
		x0,
		x1,
		y0,
		y1,
		value: node.value,
		labelX: labelOnLeft ? x0 - 7 : Math.min(width - 4, x1 + 7),
		labelY: (y0 + y1) / 2,
		labelAnchor: labelOnLeft ? 'end' : 'start'
	};
}

function compileLink<TRow>(
	linkDatum: SankeyLink<SankeySourceNode<TRow>, SankeySourceLink<TRow>>
): RelationLinkDatum {
	const source = resolveNode(linkDatum.source, 'source');
	const target = resolveNode(linkDatum.target, 'target');
	const sourceBounds = resolveNodeBounds(source);
	const targetBounds = resolveNodeBounds(target);
	if (linkDatum.y0 === undefined || linkDatum.y1 === undefined) {
		throw new TypeError('[Chart] Sankey layout produced an unresolved link position.');
	}
	return {
		kind: 'relation-link',
		identity: linkDatum.relation.identity,
		source: source.id,
		target: target.id,
		sourceLabel: source.label,
		targetLabel: target.label,
		value: linkDatum.value,
		group: linkDatum.relation.group,
		x1: sourceBounds.x1,
		y1: linkDatum.y0,
		x2: targetBounds.x0,
		y2: linkDatum.y1,
		width: linkDatum.width
	};
}

function resolveNode<TRow>(
	node: string | number | SankeyNode<SankeySourceNode<TRow>, SankeySourceLink<TRow>>,
	endpoint: 'source' | 'target'
): SankeyNode<SankeySourceNode<TRow>, SankeySourceLink<TRow>> {
	if (typeof node === 'object') return node;
	throw new TypeError(`[Chart] Sankey layout did not resolve link ${endpoint} ${String(node)}.`);
}

function resolveNodeBounds<TRow>(
	node: SankeyNode<SankeySourceNode<TRow>, SankeySourceLink<TRow>>
): { x0: number; x1: number; y0: number; y1: number } {
	if (
		node.x0 === undefined ||
		node.x1 === undefined ||
		node.y0 === undefined ||
		node.y1 === undefined
	) {
		throw new TypeError(`[Chart] Sankey node ${String(node.id)} has no layout bounds.`);
	}
	return { x0: node.x0, x1: node.x1, y0: node.y0, y1: node.y1 };
}

function resolveAlignment(align: ChartSankeyRelationMark<object>['align']): typeof sankeyLeft {
	switch (align) {
		case undefined:
		case 'justify':
			return sankeyJustify;
		case 'left':
			return sankeyLeft;
		case 'right':
			return sankeyRight;
		case 'center':
			return sankeyCenter;
	}
}

function clamp(value: number, minimum: number, maximum: number): number {
	return Math.min(maximum, Math.max(minimum, value));
}
