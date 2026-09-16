import {
	acceptInteraction,
	createRejectInteraction,
	pendingInteraction,
	type InteractionResolution
} from '$lib/utils/interactionResolution.js';
import type { EventCalendarInteractionBlockedInfo } from './eventCalendar.types.js';

type Reason = EventCalendarInteractionBlockedInfo['reason'];

export type EventCalendarInteractionResolution<TProposal> = InteractionResolution<
	TProposal,
	Reason
>;

export const pendingEventCalendarInteraction = pendingInteraction;

export const acceptEventCalendarInteraction = acceptInteraction;

/** The calendar owns its rejection copy, so the reason alone is enough at the call sites. */
export const rejectEventCalendarInteraction = createRejectInteraction<Reason>((reason) => {
	switch (reason) {
		case 'business-hours':
			return 'The proposal is outside business hours.';
		case 'custom-policy':
			return 'The consumer policy rejected the proposal.';
		case 'disabled':
			return 'Calendar mutations are disabled.';
		case 'invalid-target':
			return 'The proposal has no valid calendar target.';
		case 'overlap':
			return 'The proposal conflicts with another event.';
		case 'read-only':
			return 'The target resource is read-only.';
		case 'stale':
			return 'The controlled calendar model changed during the operation.';
		case 'valid-range':
			return 'The proposal is outside the valid calendar range.';
	}
});
