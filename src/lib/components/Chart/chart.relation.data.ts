import {
	compileChannel,
	compileKeyChannel,
	compileOptionalChannel,
	type CompiledChartChannel
} from './chart.channels.js';
import type {
	ChartKey,
	ChartColor,
	ChartNetworkRelationMark,
	ChartRelationLabelOptions,
	ChartRelationMark,
	ChartSankeyRelationMark
} from './chart.props.js';

export type RelationLabelConfiguration<TRow extends object> = {
	enabled: boolean;
	color?: ChartColor;
	fontSize: number;
	fontWeight: number;
	text?: CompiledChartChannel<TRow, string | number>;
};

export type RelationSourceNode<TRow> = {
	datum: TRow;
	index: number;
	id: ChartKey;
	identity: string;
	label: string;
	group?: ChartKey;
};

export type RelationSourceEdge<TRow> = {
	identity: string;
	source: RelationSourceNode<TRow>;
	target: RelationSourceNode<TRow>;
	value?: number;
	group?: ChartKey;
};

export type RelationNodeDatum<TRow = unknown> = RelationSourceNode<TRow> & {
	kind: 'relation-node';
	x: number;
	y: number;
	value?: number;
	internal?: boolean;
	x0?: number;
	x1?: number;
	y0?: number;
	y1?: number;
	labelX?: number;
	labelY?: number;
	labelAnchor?: 'start' | 'middle' | 'end';
};

export type RelationLinkDatum = {
	kind: 'relation-link';
	identity: string;
	source: ChartKey;
	target: ChartKey;
	sourceLabel: string;
	targetLabel: string;
	value?: number;
	group?: ChartKey;
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	width?: number;
};

export type RelationDatum = RelationNodeDatum | RelationLinkDatum;

export type CompiledRelationData<TRow extends object> = {
	nodes: readonly RelationSourceNode<TRow>[];
	nodeByIdentity: ReadonlyMap<string, RelationSourceNode<TRow>>;
	labels: RelationLabelConfiguration<TRow>;
};

export function compileRelationData<TRow extends object>(
	data: readonly TRow[],
	mark: ChartRelationMark<TRow>,
	path: string
): CompiledRelationData<TRow> {
	const nodeId = compileKeyChannel(mark.nodeId);
	const colorBy = compileOptionalChannel(mark.colorBy);
	const labels = compileLabelConfiguration(mark);
	const nodeByIdentity = new Map<string, RelationSourceNode<TRow>>();
	const nodes = data.map((datum, index) => {
		const context = { index, data };
		const id = nodeId(datum, context);
		validateKey(id, `${path}.nodeId`, index);
		const identity = relationKeyIdentity(id);
		if (nodeByIdentity.has(identity)) {
			throw new TypeError(`[Chart] ${path}.nodeId returned duplicate value ${String(id)}.`);
		}
		const labelValue = labels.text?.(datum, context);
		const group = colorBy?.(datum, context);
		if (group !== null && group !== undefined) {
			validateKey(group, `${path}.colorBy`, index);
		}
		const node: RelationSourceNode<TRow> = {
			datum,
			index,
			id,
			identity,
			label: labelValue === null || labelValue === undefined ? String(id) : String(labelValue),
			group: group ?? undefined
		};
		nodeByIdentity.set(identity, node);
		return node;
	});
	return { nodes, nodeByIdentity, labels };
}

export function compileRelationEdges<TRow extends object>(
	data: readonly TRow[],
	compiled: CompiledRelationData<TRow>,
	mark: ChartNetworkRelationMark<TRow> | ChartSankeyRelationMark<TRow>,
	path: string
): readonly RelationSourceEdge<TRow>[] {
	const relations = compileChannel(mark.relations);
	const requiresValue = mark.variant === 'sankey';
	return compiled.nodes.flatMap((source) => {
		const outgoing = relations(source.datum, { index: source.index, data });
		if (!Array.isArray(outgoing)) {
			throw new TypeError(
				`[Chart] ${path}.relations must return an array for data[${source.index}].`
			);
		}
		return outgoing.map((relation, relationIndex) => {
			validateKey(relation.target, `${path}.relations.target`, source.index);
			const target = compiled.nodeByIdentity.get(relationKeyIdentity(relation.target));
			if (!target) {
				throw new TypeError(
					`[Chart] ${path}.relations references missing target ${String(relation.target)}.`
				);
			}
			if (requiresValue && relation.value === undefined) {
				throw new TypeError(`[Chart] ${path}.relations requires a value for every Sankey link.`);
			}
			if (
				relation.value !== undefined &&
				(!Number.isFinite(relation.value) || relation.value < 0)
			) {
				throw new TypeError(`[Chart] ${path}.relations values must be finite and non-negative.`);
			}
			if (relation.group !== undefined) {
				validateKey(relation.group, `${path}.relations.group`, source.index);
			}
			return {
				identity: `${source.identity}:${target.identity}:${relationIndex}`,
				source,
				target,
				value: relation.value,
				group: relation.group ?? source.group
			};
		});
	});
}

export function isRelationDatum(value: unknown): value is RelationDatum {
	if (typeof value !== 'object' || value === null || !('kind' in value)) return false;
	return value.kind === 'relation-node' || value.kind === 'relation-link';
}

export function relationKeyIdentity(value: ChartKey): string {
	return `${typeof value}:${String(value)}`;
}

function compileLabelConfiguration<TRow extends object>(
	mark: ChartRelationMark<TRow>
): RelationLabelConfiguration<TRow> {
	const definition: ChartRelationLabelOptions<TRow> | undefined =
		mark.labels && mark.labels !== true ? mark.labels : undefined;
	return {
		enabled: mark.labels !== false,
		color: definition?.color,
		fontSize: definition?.fontSize ?? 12,
		fontWeight: definition?.fontWeight ?? 600,
		text: definition?.text === undefined ? undefined : compileChannel(definition.text)
	};
}

function validateKey(value: unknown, path: string, rowIndex: number): asserts value is ChartKey {
	if (typeof value === 'string') return;
	if (typeof value === 'number' && Number.isFinite(value)) return;
	throw new TypeError(
		`[Chart] ${path} must return a string or finite number for data[${rowIndex}].`
	);
}
