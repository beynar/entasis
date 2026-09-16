<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Alert } from 'svelai/alert';
	import { Avatar } from 'svelai/avatar';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Form } from 'svelai/form';

	let message = $state('');
	let profile = $state<{
		name?: string;
		headline?: string;
		bio?: string | null;
		location?: string | null;
		available?: boolean | null;
	}>({
		name: 'Alex Morgan',
		headline: 'Product designer & curious human',
		bio: 'I help thoughtful teams turn complex problems into clear experiences.',
		location: 'Paris, France',
		available: true
	});
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<header>
		<p class="text-primary-readable text-sm">Profile / Edit</p>
		<h2 class="mt-sm text-3xl font-semibold">Put your best self forward.</h2>
	</header>
	<div class="gap-xl grid items-start md:grid-cols-2">
		<Card title="Your details"
			><Stack gap="lg"
				><Form
					inputs={{
						name: { type: 'text', label: 'Display name', required: true },
						headline: { type: 'text', label: 'Headline', required: true },
						bio: { type: 'textarea', label: 'Short bio', maxLength: 160 },
						location: { type: 'text', label: 'Location' },
						available: { type: 'switch', label: 'Available for collaboration' }
					}}
					bind:value={profile}
					actions={[{ children: 'Save profile preview', onAction: (form) => form.submit() }]}
					onSubmit={() => (message = 'Profile saved in this local preview.')}
				/>{#if message}<Alert
						color="info"
						variant="soft"
						title="Demo result"
						description={message}
					/>{/if}</Stack
			></Card
		>
		<Stack as="aside" gap="lg">
			<p class="text-neutral/70 text-sm">LIVE PREVIEW</p>
			<Card
				><div class="gap-lg grid justify-items-center text-center">
					<div class="bg-primary-muted h-20 w-full rounded-lg"></div>
					<Avatar name={profile.name || 'Your name'} size="large" />
					<div>
						<h3 class="text-xl font-semibold">{profile.name || 'Your name'}</h3>
						<p class="mt-xs text-primary-readable text-sm">{profile.headline || 'Your headline'}</p>
					</div>
					<p class="text-neutral/65 max-w-sm text-sm">
						{profile.bio || 'Tell people what you care about.'}
					</p>
					<p class="text-neutral/70 text-xs">{profile.location}</p>
					{#if profile.available}<Chip color="success">Open to collaboration</Chip>{/if}
				</div></Card
			>
		</Stack>
	</div>
</Stack>
