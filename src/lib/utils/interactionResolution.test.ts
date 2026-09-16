import { describe, expect, it } from 'vitest';
import {
	acceptInteraction,
	createRejectInteraction,
	pendingInteraction,
	rejectInteraction
} from './interactionResolution.js';

type Reason = 'overlap' | 'read-only';

describe('interactionResolution', () => {
	it('models the three states', () => {
		expect(pendingInteraction).toEqual({ state: 'pending' });
		expect(acceptInteraction({ id: 'a' })).toEqual({ state: 'accepted', proposal: { id: 'a' } });
		expect(rejectInteraction<{ id: string }, Reason>('overlap', 'nope', { id: 'a' })).toEqual({
			state: 'rejected',
			proposal: { id: 'a' },
			reason: 'overlap',
			message: 'nope'
		});
	});

	it('defaults a rejection proposal to null', () => {
		const resolution = rejectInteraction<{ id: string }, Reason>('read-only', 'locked');
		expect(resolution).toMatchObject({ state: 'rejected', proposal: null });
	});

	it('derives the message from the reason when a resolver is supplied', () => {
		const reject = createRejectInteraction<Reason>((reason) =>
			reason === 'overlap' ? 'It overlaps.' : 'It is read-only.'
		);
		expect(reject('overlap')).toEqual({
			state: 'rejected',
			proposal: null,
			reason: 'overlap',
			message: 'It overlaps.'
		});
		const resolution = reject('read-only', { id: 'b' });
		expect(resolution.state === 'rejected' && resolution.message).toBe('It is read-only.');
	});
});
