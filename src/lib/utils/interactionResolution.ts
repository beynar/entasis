/**
 * The outcome of a proposed interactive mutation (a drag, a resize, a keyboard nudge):
 * still being negotiated, accepted with a concrete proposal, or rejected with a reason
 * and a human-readable message.
 */
export type InteractionResolution<TProposal, TReason> =
	| Readonly<{ state: 'pending' }>
	| Readonly<{ state: 'accepted'; proposal: TProposal }>
	| Readonly<{
			state: 'rejected';
			proposal: TProposal | null;
			reason: TReason;
			message: string;
	  }>;

/** Shared singleton: the pending variant carries no payload, so one instance serves every use. */
export const pendingInteraction: InteractionResolution<never, never> = { state: 'pending' };

export function acceptInteraction<TProposal, TReason = never>(
	proposal: TProposal
): InteractionResolution<TProposal, TReason> {
	return { state: 'accepted', proposal };
}

export function rejectInteraction<TProposal, TReason>(
	reason: TReason,
	message: string,
	proposal: TProposal | null = null
): InteractionResolution<TProposal, TReason> {
	return { state: 'rejected', proposal, reason, message };
}

/**
 * Builds a `reject` for owners that derive the message from the reason rather than
 * passing one at every call site.
 */
export function createRejectInteraction<TReason>(resolveMessage: (reason: TReason) => string) {
	return <TProposal>(
		reason: TReason,
		proposal: TProposal | null = null
	): InteractionResolution<TProposal, TReason> =>
		rejectInteraction<TProposal, TReason>(reason, resolveMessage(reason), proposal);
}
