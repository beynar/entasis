<script lang="ts">
	import { Avatar } from 'svelai/avatar';
	import { Button } from 'svelai/button';
	import { Form } from 'svelai/form';
	import { Sidebar } from 'svelai/sidebar';
	import { usersIcon } from 'svelai/icons/users';
	import { sidebarIcon } from 'svelai/icons/sidebar';
	import { chatCircleIcon } from 'svelai/icons/chatCircle';
	const channels = ['general', 'design', 'engineering', 'random'];
	let channel = $state('general');
	let draft = $state<{ message?: string }>({});
	let messages = $state([
		{
			channel: 'general',
			name: 'Maya Chen',
			text: 'Good morning team! The latest design review is ready.'
		},
		{
			channel: 'general',
			name: 'Sam Rivera',
			text: 'Thanks Maya. I will take a look before standup.'
		},
		{
			channel: 'design',
			name: 'Maya Chen',
			text: 'Let’s keep the first-run experience simple and useful.'
		}
	]);
</script>

<Sidebar
	frame="contained"
	class="min-h-screen"
	variant="floating"
	headerButton={{ title: 'Northstar team', subtitle: '8 members online', icon: chatCircleIcon }}
	items={[
		{
			label: 'Channels',
			items: channels.map((name) => ({
				label: '# ' + name,
				icon: chatCircleIcon,
				isActive: channel === name,
				onclick: () => (channel = name)
			}))
		},
		{
			label: 'Direct messages',
			items: [
				{ label: 'Maya Chen', icon: usersIcon, onclick: () => (channel = 'Maya Chen') },
				{ label: 'Sam Rivera', icon: usersIcon, onclick: () => (channel = 'Sam Rivera') }
			]
		}
	]}
	footerButton={{ title: 'Alex Morgan', subtitle: 'Available', avatar: { fallback: 'AM' } }}
	>{#snippet children(sidebar)}<main class="flex min-h-screen flex-col gap-lg p-lg">
			<header class="flex items-center gap-md border-b border-neutral-muted pb-lg">
				<Button
					label="Toggle channels"
					prefix={sidebarIcon}
					variant="ghost"
					onclick={sidebar.toggle}
				/>
				<div>
					<h2 class="text-xl font-semibold">{channel}</h2>
					<p class="text-xs text-neutral/60">A local conversation preview</p>
				</div>
			</header>
			<div class="grid flex-1 content-start gap-lg">
				{#each messages.filter((message) => message.channel === channel) as message (message)}<div
						class="flex items-start gap-md"
					>
						<Avatar user={{ name: message.name }} />
						<div>
							<strong class="text-sm">{message.name}</strong>
							<p class="mt-xs text-sm text-neutral/70">{message.text}</p>
						</div>
					</div>{:else}<p class="text-sm text-neutral/60">
						Start a conversation in {channel}.
					</p>{/each}
			</div>
			<Form
				inputs={{
					message: {
						type: 'text',
						label: `Message ${channel}`,
						placeholder: 'Write a message…',
						required: true
					}
				}}
				bind:value={draft}
				actions={[{ children: 'Add local message', onAction: (form) => form.submit() }]}
				onSubmit={({ message }) => {
					messages = [...messages, { channel, name: 'Alex Morgan', text: message }];
					draft = { message: '' };
				}}
			/>
		</main>{/snippet}</Sidebar
>
