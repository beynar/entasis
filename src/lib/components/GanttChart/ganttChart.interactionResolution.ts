import {
	acceptInteraction,
	pendingInteraction,
	rejectInteraction,
	type InteractionResolution
} from '$lib/utils/interactionResolution.js';
import type { GanttInteractionBlockedInfo } from './ganttChart.types.js';

export type GanttInteractionResolution<TProposal> = InteractionResolution<
	TProposal,
	GanttInteractionBlockedInfo['reason']
>;

export const pendingGanttInteraction = pendingInteraction;

export const acceptGanttInteraction = acceptInteraction;

/** The chart passes its own message (usually from the thrown scheduling error). */
export function rejectGanttInteraction<TProposal>(
	reason: GanttInteractionBlockedInfo['reason'],
	message: string,
	proposal: TProposal | null = null
): GanttInteractionResolution<TProposal> {
	return rejectInteraction(reason, message, proposal);
}
