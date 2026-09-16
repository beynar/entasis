<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Alert } from 'svelai/alert';
	import { Avatar } from 'svelai/avatar';
	import { Button } from 'svelai/button';
	import { Form } from 'svelai/form';
	import { Separator } from 'svelai/separator';
	import { TextInput } from 'svelai/text-input';

	let mailbox = $state('Inbox');
	let query = $state<string | null>('');
	let selected = $state<number | null>(1);
	let draft = $state('');
	let messages = $state([
		{
			id: 1,
			sender: 'Maya Chen',
			subject: 'Ready for the design review?',
			preview: 'The latest screens are ready for a look.',
			body: 'Hi Alex, the updated onboarding screens are ready. I simplified the first step and added a clearer progress indicator. Could you review the flow before our afternoon session? Thanks, Maya',
			archived: false
		},
		{
			id: 2,
			sender: 'Sam Rivera',
			subject: 'A few notes from research',
			preview: 'Three themes stood out this week.',
			body: 'The research sessions highlighted three priorities: faster setup, clearer navigation, and more useful empty states. I have organized the notes in the shared workspace.',
			archived: false
		},
		{
			id: 3,
			sender: 'Jordan Lee',
			subject: 'Sprint wrap-up',
			preview: 'A good week of focused progress.',
			body: 'Thanks for a productive week. We shipped the updated search and resolved the remaining accessibility issues. The next sprint plan is ready for review.',
			archived: true
		}
	]);
	let visible = $derived(
		messages.filter(
			(mail) =>
				mail.archived === (mailbox === 'Archived') &&
				(mail.sender + ' ' + mail.subject).toLowerCase().includes((query ?? '').toLowerCase())
		)
	);
	let current = $derived(messages.find((mail) => mail.id === selected));
</script>

<section class="bg-surface text-neutral grid min-h-screen md:grid-cols-[14rem_1fr]">
	<Stack
		as="aside"
		gap="lg"
		class="border-neutral-muted bg-surface-recessed p-lg border-b md:border-r"
	>
		<strong class="text-xl">Northstar Mail</strong>
		<nav class="gap-xs grid" aria-label="Mailboxes">
			{#each ['Inbox', 'Archived'] as folder (folder)}<Button
					fullWidth
					variant={mailbox === folder ? 'soft' : 'ghost'}
					onclick={() => {
						mailbox = folder;
						selected = null;
					}}
					>{folder} ({messages.filter((message) => message.archived === (folder === 'Archived'))
						.length})</Button
				>{/each}
		</nav>
		<p class="text-neutral/70 text-xs">Local inbox preview</p>
	</Stack>
	<main class="grid min-w-0 lg:grid-cols-2">
		<Stack gap="md" class="border-neutral-muted p-lg border-b lg:border-r">
			<h2 class="text-2xl font-semibold">{mailbox}</h2>
			<TextInput
				label="Search mail"
				placeholder="Find a conversation"
				bind:value={query}
			/>{#each visible as mail (mail)}<Button
					variant={selected === mail.id ? 'soft' : 'ghost'}
					color="neutral"
					fullWidth
					onclick={() => (selected = mail.id)}
					><Stack gap="xs" class="w-full text-left">
						<strong>{mail.sender}</strong><span class="text-sm">{mail.subject}</span><span
							class="text-neutral/70 text-xs">{mail.preview}</span
						>
					</Stack></Button
				>{:else}<p class="p-lg text-neutral/70 text-sm">This mailbox is empty.</p>{/each}
		</Stack>
		<Stack gap="lg" class="p-lg sm:p-xl">
			{#if current}<div class="gap-md flex flex-wrap items-start justify-between">
					<div class="gap-md flex items-center">
						<Avatar name={current.sender} />
						<div>
							<strong>{current.sender}</strong>
							<p class="text-neutral/70 text-xs">Today, 10:42</p>
						</div>
					</div>
					<Button
						variant="outline"
						size="small"
						onclick={() => {
							if (current) current.archived = !current.archived;
							selected = null;
						}}>{current.archived ? 'Move to inbox' : 'Archive'}</Button
					>
				</div>
				<h2 class="text-2xl font-semibold">{current.subject}</h2>
				<p class="text-neutral/70 leading-relaxed">{current.body}</p>
				<Separator /><Form
					inputs={{
						reply: {
							type: 'textarea',
							label: 'Your reply',
							required: true,
							placeholder: 'Write a thoughtful reply…'
						}
					}}
					actions={[{ children: 'Save reply draft', onAction: (form) => form.submit() }]}
					onSubmit={({ reply }) => (draft = reply)}
				/>{#if draft}<Alert
						color="info"
						title="Draft saved in this preview"
						description={draft}
					/>{/if}{:else}<div class="gap-md grid min-h-64 place-content-center text-center">
					<h2 class="text-xl font-semibold">A little breathing room.</h2>
					<p class="text-neutral/70 text-sm">Select a conversation to read it.</p>
				</div>{/if}
		</Stack>
	</main>
</section>
