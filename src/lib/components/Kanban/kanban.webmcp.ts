// How a Kanban appears to AI agents: `read_board`, then `move_card`, held to what a drag is held to.

import { watchWebMCPTool, type WebMCPExpose } from '$lib/utils/webmcp/webmcp.exposure.svelte.js';
import { exposureOf, toolOptions } from '$lib/utils/webmcp/webmcp.registry.js';
import type { WebMCPToolProp } from '$lib/utils/webmcp/webmcp.types.js';
import type { KanbanCard, KanbanColumnData } from './kanban.props.js';

export type KanbanToolSource = {
	readonly tool: WebMCPToolProp | undefined;
	readonly label: string;
	readonly columns: readonly KanbanColumnData[];
	readonly disabled: boolean;
	readonly canDrag:
		((payload: { card: KanbanCard; column: KanbanColumnData }) => boolean) | undefined;
	readonly accepts:
		| ((payload: { card: KanbanCard; from: KanbanColumnData; to: KanbanColumnData }) => boolean)
		| undefined;
	/** Applies a move as a drop does, `onCardMove` included. */
	readonly move: (
		card: KanbanCard,
		from: KanbanColumnData,
		to: KanbanColumnData,
		index: number
	) => void;
};

type MoveInput = { cardId: unknown; columnId: unknown; index?: unknown };

function moveCard(source: KanbanToolSource, { cardId, columnId, index }: MoveInput) {
	const to = source.columns.find((column) => column.id === columnId);
	const from = source.columns.find((column) => column.cards.some((card) => card.id === cardId));
	const card = from?.cards.find((candidate) => candidate.id === cardId);
	if (!to || !from || !card) return { status: 'invalid', message: 'Unknown card or column.' };
	if (source.disabled || source.canDrag?.({ card, column: from }) === false) {
		return { status: 'refused', message: 'This card cannot be moved.' };
	}
	if (from !== to) {
		const full = to.limit !== undefined && to.cards.length >= to.limit;
		if (full || source.accepts?.({ card, from, to }) === false) {
			return { status: 'refused', message: 'This column does not take this card.' };
		}
	}
	const size = from === to ? to.cards.length - 1 : to.cards.length;
	const place = typeof index === 'number' ? Math.max(0, Math.min(Math.trunc(index), size)) : size;
	source.move(card, from, to, place);
	return { status: 'done', cardId, columnId, index: place };
}

export const expose: WebMCPExpose<KanbanToolSource> = (source, config) => {
	const exposure = () => ({
		exposedTo: exposureOf(source.tool, config),
		modal: config.surface
	});
	const stops = [
		watchWebMCPTool(
			() => ({
				name: 'read_board',
				description: `Reads the columns and cards of ${source.label}.`,
				inputSchema: { type: 'object', properties: {}, additionalProperties: false },
				annotations: { readOnlyHint: true, untrustedContentHint: true },
				execute: () => ({
					columns: source.columns.map(({ id, title, limit, cards }) => ({
						id,
						title,
						limit,
						cards: cards.map((card) => ({
							id: card.id,
							title: card.title,
							description: card.description
						}))
					}))
				})
			}),
			exposure
		),
		watchWebMCPTool(() => {
			if (source.disabled) return null;
			const options = toolOptions(source.tool);
			return {
				name: options.name ?? 'move_card',
				title: options.title,
				description:
					options.description ??
					`Moves a card of ${source.label} to a column, at an index. Read the board first.`,
				inputSchema: {
					type: 'object',
					properties: {
						cardId: {
							type: 'string',
							enum: source.columns.flatMap((column) => column.cards.map((card) => card.id))
						},
						columnId: { type: 'string', enum: source.columns.map((column) => column.id) },
						index: {
							type: 'integer',
							minimum: 0,
							description: 'Defaults to the end of the column.'
						}
					},
					required: ['cardId', 'columnId'],
					additionalProperties: false
				},
				annotations: { consequentialHint: options.consequential ?? true },
				execute: (input: MoveInput) => moveCard(source, input)
			};
		}, exposure)
	];
	return () => {
		for (const stop of stops) stop();
	};
};
