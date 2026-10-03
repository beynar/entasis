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
import { axisFraction, estimateLabelWidth, fitAxis, LABEL_LINE_BOX } from './chart.fit.js';
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
	const horizontal = orientation === 'horizontal';
	const labels = compiled.labels;
	// d3 spaces the tree on a unit grid; the fit below maps it onto the plot. Only the relative
	// positions matter here, and d3's half-separation gaps at the edges are dropped.
	const layoutRoot = tree<TreeSourceNode<TRow>>().size([1, 1])(root);
	const layoutNodes = layoutRoot.descendants();
	const breadthValues = layoutNodes.map((node) => node.x);
	const breadthMin = Math.min(...breadthValues);
	const breadthMax = Math.max(...breadthValues);
	const maxDepth = layoutRoot.height;
	const placed = layoutNodes.map((node) => {
		const internal = node.children !== undefined;
		const labelWidth = labels.enabled
			? estimateLabelWidth(node.data.label, labels.fontSize, labels.fontWeight)
			: 0;
		return {
			node,
			internal,
			labelWidth,
			breadth: axisFraction(node.x, breadthMin, breadthMax),
			depth: maxDepth > 0 ? node.depth / maxDepth : 0.5
		};
	});
	// Horizontal: internal labels sit left of their node and leaf labels right, both centred on
	// it vertically. Vertical: labels are centred on the node, above internal nodes and below
	// leaves. Each axis is fitted to the extents those labels add around the nodes.
	const lineAbove = labels.enabled ? labels.fontSize * LABEL_LINE_BOX.middle.above : 0;
	const lineBelow = labels.enabled ? labels.fontSize * LABEL_LINE_BOX.middle.below : 0;
	const depthFit = fitAxis(
		placed.map(({ depth, internal, labelWidth }) => {
			if (!labels.enabled) return { fraction: depth, before: radius, after: radius };
			if (horizontal) {
				return {
					fraction: depth,
					before: internal ? radius + 7 + labelWidth : radius,
					after: internal ? radius : radius + 7 + labelWidth
				};
			}
			return {
				fraction: depth,
				before: internal ? radius + 8 + lineAbove : radius,
				after: internal ? radius : radius + 10 + lineBelow
			};
		}),
		horizontal ? width : height
	);
	const breadthFit = fitAxis(
		placed.map(({ breadth, labelWidth }) => {
			if (horizontal) {
				return {
					fraction: breadth,
					before: Math.max(radius, lineAbove),
					after: Math.max(radius, lineBelow)
				};
			}
			const extent = Math.max(radius, labelWidth / 2);
			return { fraction: breadth, before: extent, after: extent };
		}),
		horizontal ? height : width
	);
	const position = new Map(
		placed.map(({ node, breadth, depth }) => {
			const along = depthFit.start + depth * depthFit.span;
			const across = breadthFit.start + breadth * breadthFit.span;
			return [node, horizontal ? { x: along, y: across } : { x: across, y: along }] as const;
		})
	);
	const at = (node: (typeof layoutNodes)[number]) => {
		const point = position.get(node);
		if (!point) throw new Error('[Chart] Tree layout lost a positioned node.');
		return point;
	};
	const nodes: RelationNodeDatum<TRow>[] = placed.map(({ node, internal }) => {
		const { x, y } = at(node);
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
	const links: RelationLinkDatum[] = layoutRoot.links().map(({ source, target }) => {
		const from = at(source);
		const to = at(target);
		return {
			kind: 'relation-link',
			identity: `${source.data.identity}:${target.data.identity}`,
			source: source.data.id,
			target: target.data.id,
			sourceLabel: source.data.label,
			targetLabel: target.data.label,
			group: target.data.group,
			x1: from.x,
			y1: from.y,
			x2: to.x,
			y2: to.y
		};
	});
	return compileRelationPointMarks(nodes, links, mark, compiled.labels, path);
}
