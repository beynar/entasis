<script lang="ts">
	import { Timeline, type TimelineItem } from '$lib/components/Timeline/index.js';

	const claim: TimelineItem[] = [
		{ id: 'opened', title: 'Opened', description: 'Mar 3', progress: 'done' },
		{ id: 'documents', title: 'Documents', description: 'Mar 9', progress: 'done' },
		{ id: 'appraisal', title: 'Appraisal', description: 'Under way', progress: 'current' },
		{ id: 'report', title: 'Report', progress: 'upcoming' },
		{ id: 'offer', title: 'Offer', progress: 'upcoming' },
		{ id: 'closed', title: 'Closed', progress: 'upcoming' }
	];

	const onboarding: TimelineItem[] = [
		{ id: 'account', title: 'Account created', progress: 'done' },
		{ id: 'profile', title: 'Profile completed', progress: 'current' },
		{ id: 'team', title: 'Invite your team', progress: 'upcoming' }
	];
</script>

<div class="grid w-full max-w-5xl gap-10 p-2">
	<Timeline
		items={claim}
		orientation="horizontal"
		color="primary"
		density="compact"
		aria-label="Claim progress"
	/>
	<Timeline items={onboarding} size="small" color="success" aria-label="Onboarding progress" />
</div>
