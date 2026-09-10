<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Alert } from 'svelai/alert';
	import { Avatar } from 'svelai/avatar';
	import { Chip } from 'svelai/chip';
	import { Form } from 'svelai/form';

	let message = $state('');
	let profile = $state<{
		name?: string;
		email?: string;
		title?: string | null;
		location?: string | null;
		bio?: string | null;
		website?: string | null;
		visible?: boolean | null;
	}>({
		name: 'Alex Morgan',
		email: 'alex@example.com',
		title: 'Product designer',
		location: 'Paris, France',
		bio: 'Making useful things with thoughtful teams.',
		website: 'https://example.com',
		visible: true
	});
</script>

<Stack as="section" gap="lg" class="mx-auto w-full max-w-5xl p-md text-neutral sm:p-xl">
	<div class="overflow-hidden rounded-lg border border-neutral-muted">
		<div
			class="flex h-40 flex-wrap items-end justify-between gap-md bg-primary p-lg text-primary-contrast"
		>
			<span class="text-sm">Northstar / Your profile</span><Chip color="neutral"
				>Personal settings</Chip
			>
		</div>
		<Stack gap="xl" class="bg-surface p-lg sm:p-xl">
			<div class="flex flex-wrap items-center gap-lg">
				<Avatar user={{ name: profile.name ?? 'Your name' }} size="large" />
				<div>
					<h2 class="text-2xl font-semibold">{profile.name}</h2>
					<p class="text-sm text-neutral/60">Make it easier for your team to know you.</p>
				</div>
			</div>
			<Form
				variant="sectioned"
				inputs={{
					basics: {
						type: 'group',
						label: 'Personal details',
						columns: 2,
						inputs: {
							name: { type: 'text', label: 'Full name', required: true },
							email: { type: 'email', label: 'Email address', required: true },
							title: { type: 'text', label: 'Job title' },
							location: { type: 'text', label: 'Location' }
						}
					},
					bio: { type: 'textarea', label: 'About you', maxLength: 240 },
					website: { type: 'url', label: 'Personal website' },
					visible: { type: 'switch', label: 'Show my profile to workspace members' }
				}}
				bind:value={profile}
				actions={[{ children: 'Save profile locally', onAction: (form) => form.submit() }]}
				onSubmit={({ name }) => (message = `Profile for ${name} saved in this preview.`)}
			/>{#if message}<Alert
					color="info"
					variant="soft"
					title="Demo result"
					description={message}
				/>{/if}
		</Stack>
	</div>
</Stack>
