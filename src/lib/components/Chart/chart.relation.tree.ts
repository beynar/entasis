import { stratify, tree } from 'd3-hierarchy';
import { compileChannel } from './chart.channels.js';
import type { CompiledMark } from './chart.cartesian.js';
import type { ChartTreeRelationMark } from './chart.props.js';
import type {
	CompiledRelationData,
	RelationLinkDatum,
	RelationNodeDatum,
	RelationSourceNode
} from './chart.relation.data.js';
import { relationKeyIdentity } from './chart.relation.data.js';
import { compileRelationPointMarks } from './chart.relation.marks.js';

type TreeSourceNode<TRow> = RelationSourceNode<TRow> & {
	parentIdentity: string | null;
};

export function compileTreeRelation<TRow extends object>(
	data: readonly TRow[],
	mark: ChartTreeRelationMark<TRow>,
	compiled: CompiledRelationData<TRow>,
	path: string,
	width: number,
	height: number
): readonly CompiledMark[] {
	if (compiled.nodes.length === 0) {
		return compileRelationPointMarks([], [], mark, compiled.labels, path);
	}
	const parent = compileChannel(mark.parent);
	const sourceNodes: TreeSourceNode<TRow>[] = compiled.nodes.map((node) => {
		const parentId = parent(node.datum, { index: node.index, data });
		if (parentId === null || parentId === undefined) return { ...node, parentIdentity: null };
		const parentIdentity = relationKeyIdentity(parentId);
		if (!compiled.nodeByIdentity.has(parentIdentity)) {
			throw new TypeError(`[Chart] ${path}.parent references missing node ${String(parentId)}.`);
		}
		return { ...node, parentIdentity };
	});
	const roots = sourceNodes.filter((node) => node.parentIdentity === null);
	if (roots.length !== 1) {
		throw new TypeError(`[Chart] ${path}.parent must define exactly one root node.`);
	}
	const root = stratify<TreeSourceNode<TRow>>()
		.id((node) => node.identity)
		.parentId((node) => node.parentIdentity)(sourceNodes);
	const orientation = mark.orientation ?? 'horizontal';
	const radius = mark.nodeRadius ?? 5;
	const padding = clamp(Math.min(width, height) * 0.06, 24, 48);
	const labelSpace = compiled.labels.enabled ? clamp(width * 0.13, 64, 120) : padding;
	const horizontal = orientation === 'horizontal';
	const breadth = Math.max(1, (horizontal ? height : width) - padding * 2);
	const depth = Math.max(1, horizontal ? width - labelSpace * 2 : height - padding * 2);
	const layoutRoot = tree<TreeSourceNode<TRow>>().size([breadth, depth])(root);
	const nodes: RelationNodeDatum<TRow>[] = layoutRoot.descendants().map((node) => {
		const x = horizontal ? labelSpace + node.y : padding + node.x;
		const y = horizontal ? padding + node.x : padding + node.y;
		const internal = node.children !== undefined;
		return {
			...node.data,
			kind: 'relation-node',
			x,
			y,
			internal,
			labelX: horizontal ? x + (internal ? -radius - 7 : radius + 7) : x,
			labelY: horizontal ? y : y + (internal ? -radius - 8 : radius + 10),
			labelAnchor: horizontal ? (internal ? 'end' : 'start') : 'middle'
		};
	});
	const links: RelationLinkDatum[] = layoutRoot.links().map(({ source, target }) => ({
		kind: 'relation-link',
		identity: `${source.data.identity}:${target.data.identity}`,
		source: source.data.id,
		target: target.data.id,
		sourceLabel: source.data.label,
		targetLabel: target.data.label,
		group: target.data.group,
		x1: horizontal ? labelSpace + source.y : padding + source.x,
		y1: horizontal ? padding + source.x : padding + source.y,
		x2: horizontal ? labelSpace + target.y : padding + target.x,
		y2: horizontal ? padding + target.x : padding + target.y
	}));
	return compileRelationPointMarks(nodes, links, mark, compiled.labels, path);
}

function clamp(value: number, minimum: number, maximum: number): number {
	return Math.min(maximum, Math.max(minimum, value));
}
