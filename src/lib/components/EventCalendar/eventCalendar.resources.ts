import { FlatHierarchyError, buildFlatHierarchy } from '$lib/scheduling/flatHierarchy.js';
import {
	admitEventCalendarResourceBusinessHours,
	type EventCalendarAdmittedBusinessHours
} from './eventCalendar.businessHours.js';
import { EventCalendarError } from './eventCalendar.error.js';
import type { EventCalendarDayBucket } from './eventCalendar.items.js';
import type { EventCalendarItem, EventCalendarResource } from './eventCalendar.types.js';

export type EventCalendarResourceStructureNode = Readonly<{
	id: string;
	parentId?: string;
	depth: number;
	isLeaf: boolean;
	leafStart: number;
	leafSpan: number;
}>;

export type EventCalendarResourceStructure = Readonly<{
	signature: string;
	nodes: readonly EventCalendarResourceStructureNode[];
	leaves: readonly EventCalendarResourceStructureNode[];
	maxDepth: number;
}>;

export type EventCalendarResourceColumn<TResourceFields extends object> = Readonly<{
	key: string;
	resourceId?: string;
	resource: EventCalendarResource<TResourceFields> | null;
	depth: number;
	isUnassigned: boolean;
}>;

export type EventCalendarResourceHeaderCell<TResourceFields extends object> = Readonly<{
	key: string;
	resource: EventCalendarResource<TResourceFields> | null;
	resourceId?: string;
	depth: number;
	isLeaf: boolean;
	isUnassigned: boolean;
	columnStart: number;
	columnSpan: number;
	rowSpan: number;
}>;

export type EventCalendarResourceModel<TResourceFields extends object> = Readonly<{
	structure: EventCalendarResourceStructure;
	columns: readonly EventCalendarResourceColumn<TResourceFields>[];
	headerCells: readonly EventCalendarResourceHeaderCell<TResourceFields>[];
	leafIds: ReadonlySet<string>;
	resolveLeaf(resourceId?: string): EventCalendarResource<TResourceFields> | null;
	resolveLeafId(resourceId?: string): string | undefined;
	resolveItemLeafIds(item: Pick<EventCalendarItem<object>, 'resourceId' | 'resourceIds'>): string[];
	getBusinessHours(resourceId?: string): readonly EventCalendarAdmittedBusinessHours[] | null;
	isReadOnly(resourceId?: string): boolean;
}>;

type EventCalendarAdmittedResource<TResourceFields extends object> = Readonly<{
	resource: EventCalendarResource<TResourceFields>;
	businessHours: readonly EventCalendarAdmittedBusinessHours[] | null;
}>;
type EventCalendarResourceAdmission<TResourceFields extends object> = ReadonlyMap<
	string,
	EventCalendarAdmittedResource<TResourceFields>
>;

export function createEventCalendarResourceModel<TResourceFields extends object>(
	resources: readonly EventCalendarResource<TResourceFields>[]
): EventCalendarResourceModel<TResourceFields> {
	const admittedResources = validateResourceDefinitions(resources);
	const signature = JSON.stringify(
		resources.map((resource) => [resource.id, resource.parentId ?? null])
	);
	const structure = buildResourceStructure(resources, signature);
	const leafIds = new Set(structure.leaves.map((leaf) => leaf.id));
	const columns: EventCalendarResourceColumn<TResourceFields>[] = structure.leaves.map((leaf) => ({
		key: `resource:${leaf.id}`,
		resourceId: leaf.id,
		resource: admittedResources.get(leaf.id)?.resource ?? null,
		depth: leaf.depth,
		isUnassigned: false
	}));
	columns.push({
		key: 'resource:unassigned',
		resource: null,
		depth: 0,
		isUnassigned: true
	});

	const headerCells: EventCalendarResourceHeaderCell<TResourceFields>[] = structure.nodes.map(
		(node) => ({
			key: `resource-header:${node.id}`,
			resourceId: node.id,
			resource: admittedResources.get(node.id)?.resource ?? null,
			depth: node.depth,
			isLeaf: node.isLeaf,
			isUnassigned: false,
			columnStart: node.leafStart,
			columnSpan: node.leafSpan,
			rowSpan: node.isLeaf ? structure.maxDepth - node.depth + 1 : 1
		})
	);
	headerCells.push({
		key: 'resource-header:unassigned',
		resource: null,
		depth: 0,
		isLeaf: true,
		isUnassigned: true,
		columnStart: structure.leaves.length,
		columnSpan: 1,
		rowSpan: structure.maxDepth + 1
	});

	return {
		structure,
		columns,
		headerCells,
		leafIds,
		resolveLeaf: (resourceId) =>
			resourceId && leafIds.has(resourceId)
				? (admittedResources.get(resourceId)?.resource ?? null)
				: null,
		resolveLeafId: (resourceId) => (resourceId && leafIds.has(resourceId) ? resourceId : undefined),
		resolveItemLeafIds: (item) =>
			getEventCalendarResourceIds(item).flatMap((resourceId) =>
				leafIds.has(resourceId) ? [resourceId] : []
			),
		getBusinessHours: (resourceId) =>
			resourceId && leafIds.has(resourceId)
				? (admittedResources.get(resourceId)?.businessHours ?? null)
				: null,
		isReadOnly: (resourceId) =>
			Boolean(
				resourceId &&
				leafIds.has(resourceId) &&
				admittedResources.get(resourceId)?.resource.readOnly
			)
	};
}

export function filterEventCalendarBucketByResource<TItemFields extends object>(
	bucket: EventCalendarDayBucket<TItemFields> | undefined,
	model: EventCalendarResourceModel<object>,
	resourceId?: string
): EventCalendarDayBucket<TItemFields> | undefined {
	if (!bucket) return undefined;
	const belongsToColumn = (item: EventCalendarItem<TItemFields>): boolean => {
		const resourceIds = model.resolveItemLeafIds(item);
		return resourceId === undefined ? resourceIds.length === 0 : resourceIds.includes(resourceId);
	};
	const filter = (segments: readonly (typeof bucket.all)[number][]) =>
		segments.filter((segment) => belongsToColumn(segment.occurrence.item));
	return {
		all: filter(bucket.all),
		foreground: filter(bucket.foreground),
		background: filter(bucket.background),
		allDay: filter(bucket.allDay),
		timed: filter(bucket.timed)
	};
}

export function getEventCalendarResourceIds(item: {
	resourceId?: string;
	resourceIds?: readonly string[];
}): string[] {
	if (item.resourceIds !== undefined) return [...item.resourceIds];
	return item.resourceId === undefined ? [] : [item.resourceId];
}

export function setEventCalendarResourceIds<TItemFields extends object>(
	item: EventCalendarItem<TItemFields>,
	resourceIds: readonly string[]
): EventCalendarItem<TItemFields> {
	const next = { ...item };
	delete next.resourceId;
	delete next.resourceIds;
	if (resourceIds.length === 1) next.resourceId = resourceIds[0];
	else if (resourceIds.length > 1) next.resourceIds = [...resourceIds];
	return next;
}

export function replaceEventCalendarResourceAssignment<TItemFields extends object>(
	item: EventCalendarItem<TItemFields>,
	sourceResourceId: string | undefined,
	targetResourceId: string | undefined
): EventCalendarItem<TItemFields> {
	const current = getEventCalendarResourceIds(item);
	const next = current.filter((resourceId) => resourceId !== sourceResourceId);
	if (targetResourceId !== undefined && !next.includes(targetResourceId))
		next.push(targetResourceId);
	return setEventCalendarResourceIds(item, next);
}

function validateResourceDefinitions<TResourceFields extends object>(
	resources: readonly EventCalendarResource<TResourceFields>[]
): EventCalendarResourceAdmission<TResourceFields> {
	if (!Array.isArray(resources)) {
		throw new EventCalendarError('invalid-resource', 'resources must be an array.');
	}
	const admittedResources = new Map<string, EventCalendarAdmittedResource<TResourceFields>>();
	for (const resource of resources) {
		if (!resource || typeof resource !== 'object') {
			throw new EventCalendarError('invalid-resource', 'Every resource must be an object.');
		}
		if (typeof resource.id !== 'string' || resource.id.length === 0) {
			throw new EventCalendarError('invalid-resource', 'Every resource needs a non-empty id.');
		}
		if (admittedResources.has(resource.id)) {
			throw new EventCalendarError('invalid-resource', `Duplicate resource id: ${resource.id}.`, {
				id: resource.id
			});
		}
		if (typeof resource.title !== 'string') {
			throw new EventCalendarError('invalid-resource', `Resource ${resource.id} needs a title.`, {
				id: resource.id
			});
		}
		if (resource.businessHours !== undefined && !Array.isArray(resource.businessHours)) {
			throw new EventCalendarError(
				'invalid-resource',
				`Resource ${resource.id} businessHours must be an array.`,
				{ id: resource.id }
			);
		}
		const businessHours = admitEventCalendarResourceBusinessHours(resource.businessHours, () =>
			invalidResourceBusinessHours(resource.id)
		);
		admittedResources.set(resource.id, {
			resource,
			businessHours: businessHours ?? null
		});
	}
	return admittedResources;
}

function invalidResourceBusinessHours(resourceId: string): EventCalendarError {
	return new EventCalendarError(
		'invalid-resource',
		`Resource ${resourceId} has invalid businessHours.`,
		{ id: resourceId }
	);
}

function buildResourceStructure<TResourceFields extends object>(
	resources: readonly EventCalendarResource<TResourceFields>[],
	signature: string
): EventCalendarResourceStructure {
	try {
		const hierarchy = buildFlatHierarchy(resources);
		const nodes = hierarchy.nodes.map(({ id, parentId, depth, isLeaf, leafStart, leafSpan }) => ({
			id,
			...(parentId === null ? {} : { parentId }),
			depth,
			isLeaf,
			leafStart,
			leafSpan
		}));
		return {
			signature,
			nodes,
			leaves: hierarchy.leaves.map((leaf) => {
				const node = nodes[leaf.preorderIndex];
				if (node) return node;
				throw new EventCalendarError('invalid-resource', 'Resource hierarchy is incomplete.');
			}),
			maxDepth: hierarchy.maxDepth
		};
	} catch (error) {
		if (!(error instanceof FlatHierarchyError)) throw error;
		if (error.code !== 'cycle')
			throw new EventCalendarError(
				'invalid-resource',
				`Resource ${error.details.id} has an invalid parent.`,
				{
					...error.details
				}
			);
		throw new EventCalendarError(
			'invalid-resource',
			'Resource hierarchy contains a cycle.',
			error.details
		);
	}
}
