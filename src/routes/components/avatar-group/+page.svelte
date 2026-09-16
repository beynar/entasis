<script lang="ts">
	import Avatar from '$lib/components/Avatar/Avatar.svelte';
	import AvatarGroup from '$lib/components/Avatar/AvatarGroup.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	const people = [
		{
			name: 'Guillermo Rauch',
			src: 'https://avatars.githubusercontent.com/rauchg?s=96',
			status: 'online'
		},
		{
			name: 'Sarah Drasner',
			src: 'https://avatars.githubusercontent.com/sdras?s=96',
			status: 'online'
		},
		{
			name: 'Rich Harris',
			src: 'https://avatars.githubusercontent.com/Rich-Harris?s=96',
			status: 'away'
		},
		{ name: 'Maya Chen', status: 'offline' },
		{ name: 'Noah Williams', status: 'online' },
		{ name: 'Ava Thompson', status: 'offline' }
	];

	const sizes = ['small', 'normal', 'large'] as const;
	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: sizes
		},
		{
			name: 'max',
			type: 'slider',
			label: 'Visible',
			value: 4,
			min: 2,
			max: people.length,
			step: 1,
			showValue: true
		}
	]);
	const statusColors: Record<string, string> = {
		online: 'bg-success',
		away: 'bg-warning',
		offline: 'bg-neutral-muted'
	};
</script>

<DocPage
	title="Avatar Group"
	subtitle="Displays a compact stack of people with optional overflow and custom avatar rendering."
	component="AvatarGroup"
	features={[
		'Uses the Avatar primitive by default',
		'Optional maximum with remaining count',
		'Image and initials fallbacks',
		'Custom avatar and count snippets',
		'Small, normal, and large sizes'
	]}
>
	<ComponentCard
		{controls}
		description="Adjust the avatar scale and how many people remain visible before overflow."
		code={`<AvatarGroup items={people} size="${controls.value.size}" max={${controls.value.max}} />`}
	>
		<AvatarGroup items={people} size={controls.value.size} max={controls.value.max} />
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Overflow"
			description="Limit visible avatars with max; the remaining people collapse into a count."
			class="!min-h-fit"
			code={`<AvatarGroup {people} max={4} />`}
		>
			<AvatarGroup items={people} max={4} />
		</ComponentCard>

		<ComponentCard
			title="Sizes"
			description="The overlap and remaining count follow the selected avatar size."
			class="!min-h-fit"
			code={`{#each ['small', 'normal', 'large'] as size}
	<AvatarGroup {size} items={people} max={4} />
{/each}`}
		>
			<div class="flex flex-col items-center gap-6">
				{#each sizes as size (size)}
					<AvatarGroup {size} items={people} max={4} />
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			title="Mixed Fallbacks"
			description="People without an image automatically use initials without changing the group layout."
			class="!min-h-fit"
			code={`<AvatarGroup
	items={[
		{ name: 'Guillermo Rauch', src: '/guillermo.jpg' },
		{ name: 'Sarah Drasner', src: '/sarah.jpg' },
		{ name: 'Maya Chen' },
		{ name: 'Noah Williams' }
	]}
/>`}
		>
			<AvatarGroup items={people.slice(0, 5)} />
		</ComponentCard>

		<ComponentCard
			title="Custom Avatars"
			description="Use the avatar snippet to decorate each person while retaining shared group props."
			class="!min-h-fit"
			code={`<AvatarGroup items={people} max={4}>
	{#snippet avatar({ item, avatarProps })}
		<Avatar {...avatarProps} {...item}>
			{#snippet suffix()}
				<span class="size-full rounded-full bg-success"></span>
			{/snippet}
		</Avatar>
	{/snippet}
</AvatarGroup>`}
		>
			<AvatarGroup items={people} max={4}>
				{#snippet avatar({ item, avatarProps })}
					<Avatar {...avatarProps} {...item}>
						{#snippet suffix()}
							<span class="size-full rounded-full {statusColors[item.status]}"></span>
						{/snippet}
					</Avatar>
				{/snippet}
			</AvatarGroup>
		</ComponentCard>

		<ComponentCard
			title="Custom Remaining Count"
			description="Replace the default +N label without rebuilding the overflow avatar."
			class="!min-h-fit"
			code={`<AvatarGroup items={people} max={3}>
	{#snippet remainingCount({ remaining })}
		<span title={remaining + ' more people'}>{remaining}</span>
	{/snippet}
</AvatarGroup>`}
		>
			<AvatarGroup items={people} max={3}>
				{#snippet remainingCount({ remaining })}
					<span title={`${remaining} more people`}>{remaining}</span>
				{/snippet}
			</AvatarGroup>
		</ComponentCard>
	{/snippet}
</DocPage>
