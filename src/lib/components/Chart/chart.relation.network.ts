import {
	forceCenter,
	forceCollide,
	forceLink,
	forceManyBody,
	forceSimulation,
	forceX,
	forceY,
	type SimulationLinkDatum,
	type SimulationNodeDatum
} from 'd3-force';
import type { CompiledMark } from './chart.cartesian.js';
import type { ChartNetworkRelationMark } from './chart.props.js';
import {
	compileRelationEdges,
	type CompiledRelationData,
	type RelationLinkDatum,
	type RelationNodeDatum,
	type RelationSourceEdge,
	type RelationSourceNode
} from './chart.relation.data.js';
import { axisFraction, estimateLabelWidth, fitAxis, LABEL_LINE_BOX } from './chart.fit.js';
import { compileRelationPointMarks } from './chart.relation.marks.js';

type ForceNode<TRow> = RelationSourceNode<TRow> & SimulationNodeDatum;

type ForceEdge<TRow> = SimulationLinkDatum<ForceNode<TRow>> & {
	source: string | ForceNode<TRow>;
	target: string | ForceNode<TRow>;
	relation: RelationSourceEdge<TRow>;
};

export function compileNetworkRelation<TRow extends object>(
	data: readonly TRow[],
	mark: ChartNetworkRelationMark<TRow>,
	compiled: CompiledRelationData<TRow>,
	path: string,
	width: number,
	height: number
): readonly CompiledMark[] {
	const relations = compileRelationEdges(data, compiled, mark, path);
	const radius = mark.nodeRadius ?? 7;
	const nodes: ForceNode<TRow>[] = compiled.nodes.map((node) => ({ ...node }));
	const links: ForceEdge<TRow>[] = relations.map((relation) => ({
		source: relation.source.identity,
		target: relation.target.identity,
		relation
	}));
	const linkDistance = clamp(Math.min(width, height) * 0.14, 48, 100);
	const simulation = forceSimulation(nodes)
		.force(
			'link',
			forceLink<ForceNode<TRow>, ForceEdge<TRow>>(links)
				.id((node) => node.identity)
				.distance((link) => linkDistance - Math.min(link.relation.value ?? 1, 12))
				.strength((link) => 0.22 + Math.min(link.relation.value ?? 1, 10) * 0.035)
		)
		.force('charge', forceManyBody<ForceNode<TRow>>().strength(-180))
		.force('center', forceCenter(width / 2, height / 2))
		.force('collision', forceCollide<ForceNode<TRow>>(radius + 8).strength(0.9))
		.force('x', forceX<ForceNode<TRow>>(width / 2).strength(0.035))
		.force('y', forceY<ForceNode<TRow>>(height / 2).strength(0.035))
		.stop();
	simulation.tick(300);
	// The simulation settles a shape around the centre at whatever size its forces give it; fit
	// that shape to the plot on each axis, leaving room for the labels drawn above the nodes.
	const labels = compiled.labels;
	const settled = nodes.map((node) => ({
		node,
		x: coordinate(node.x, node.id, 'x'),
		y: coordinate(node.y, node.id, 'y'),
		labelWidth: labels.enabled
			? estimateLabelWidth(node.label, labels.fontSize, labels.fontWeight)
			: 0
	}));
	const xs = settled.map((node) => node.x);
	const ys = settled.map((node) => node.y);
	const [xMin, xMax, yMin, yMax] = [
		Math.min(...xs),
		Math.max(...xs),
		Math.min(...ys),
		Math.max(...ys)
	];
	const xFit = fitAxis(
		settled.map((node) => {
			const extent = Math.max(radius, node.labelWidth / 2);
			return { fraction: axisFraction(node.x, xMin, xMax), before: extent, after: extent };
		}),
		width
	);
	const yFit = fitAxis(
		settled.map((node) => ({
			fraction: axisFraction(node.y, yMin, yMax),
			before: labels.enabled ? radius + 10 + labels.fontSize * LABEL_LINE_BOX.middle.above : radius,
			after: radius
		})),
		height
	);
	const positionedNodes: RelationNodeDatum<TRow>[] = settled.map(
		({ node, x: settledX, y: settledY }) => {
			const x = xFit.start + axisFraction(settledX, xMin, xMax) * xFit.span;
			const y = yFit.start + axisFraction(settledY, yMin, yMax) * yFit.span;
			return {
				...node,
				kind: 'relation-node',
				x,
				y,
				labelX: x,
				labelY: y - radius - 10,
				labelAnchor: 'middle'
			};
		}
	);
	const positionByIdentity = new Map(positionedNodes.map((node) => [node.identity, node] as const));
	const positionedLinks: RelationLinkDatum[] = links.map((link) => {
		const source = resolveForceNode(link.source, 'source');
		const target = resolveForceNode(link.target, 'target');
		const sourcePosition = positionByIdentity.get(source.identity);
		const targetPosition = positionByIdentity.get(target.identity);
		if (!sourcePosition || !targetPosition) {
			throw new Error('[Chart] Network layout lost a positioned node.');
		}
		return {
			kind: 'relation-link',
			identity: link.relation.identity,
			source: source.id,
			target: target.id,
			sourceLabel: source.label,
			targetLabel: target.label,
			value: link.relation.value,
			group: link.relation.group,
			x1: sourcePosition.x,
			y1: sourcePosition.y,
			x2: targetPosition.x,
			y2: targetPosition.y,
			width: linkWidth(link.relation.value)
		};
	});
	return compileRelationPointMarks(positionedNodes, positionedLinks, mark, compiled.labels, path);
}

function resolveForceNode<TRow>(
	node: string | ForceNode<TRow>,
	endpoint: 'source' | 'target'
): ForceNode<TRow> {
	if (typeof node !== 'string') return node;
	throw new TypeError(`[Chart] Network layout did not resolve link ${endpoint} ${node}.`);
}

function coordinate(value: number | undefined, nodeId: string | number, axis: 'x' | 'y'): number {
	if (value !== undefined && Number.isFinite(value)) return value;
	throw new TypeError(
		`[Chart] Network layout produced no ${axis} coordinate for ${String(nodeId)}.`
	);
}

function linkWidth(value: number | undefined): number {
	if (value === undefined) return 1.5;
	return Math.min(5, 1 + Math.sqrt(value) * 0.5);
}

function clamp(value: number, minimum: number, maximum: number): number {
	return Math.min(maximum, Math.max(minimum, value));
}
