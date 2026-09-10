<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Avatar } from 'svelai/avatar';
	import { Button } from 'svelai/button';
	import { Chip } from 'svelai/chip';
	let copied = $state(false);
	let copyError = $state('');
	async function copyLink() {
		try {
			await navigator.clipboard.writeText(window.location.href);
			copied = true;
			copyError = '';
		} catch (error) {
			copyError = error instanceof Error ? error.message : 'The browser could not copy this link.';
		}
	}
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<article class="flex flex-col gap-xl mx-auto max-w-3xl">
		<Chip class="w-fit" variant="soft">Practical reading</Chip>
		<header class="flex flex-col gap-lg">
			<p class="text-xs font-semibold uppercase tracking-widest text-primary">
				Resource / Design practice
			</p>
			<Heading size="h2" weight="bold">Better questions make better interfaces.</Heading>
			<p class="max-w-2xl text-neutral/65">
				A short guide to finding the real problem before choosing a solution.
			</p>
		</header>
		<div class="flex gap-lg items-center justify-between flex-wrap">
			<div class="flex gap-md items-center">
				<Avatar user={{ name: 'Maya Chen' }} />
				<div class="text-sm">
					<p>Maya Chen</p>
					<p class="text-neutral/50">7 min read · June 2026</p>
				</div>
			</div>
			<Button variant="outline" onclick={copyLink}
				>{copied ? 'Link copied' : 'Copy article link'}</Button
			>
		</div>
		<img
			src="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&amp;fit=crop&amp;w=1100&amp;q=80"
			alt="Desert light"
			loading="lazy"
			class="aspect-video w-full rounded-lg object-cover"
		/>
		<p class="text-lg leading-relaxed">
			The first sketch is often an answer to a question nobody has asked clearly. Before opening a
			design file, take a little time to understand what someone is trying to do.
		</p>
		<div class="rounded-lg bg-surface-recessed p-xl">
			<Heading size="h4">Three questions to begin with</Heading>
			<ol class="flex flex-col gap-lg mt-xl list-inside list-decimal">
				<li>What is the person trying to achieve?</li>
				<li>What gets in their way today?</li>
				<li>How will we know the experience improved?</li>
			</ol>
		</div>
		<p class="leading-relaxed text-neutral/70">
			Write the answers in language that anyone on the team can understand. A useful problem
			statement should guide a decision without prescribing the interface.
		</p>
		{#if copyError}<p class="text-sm text-danger" role="alert">{copyError}</p>{/if}
	</article>
</section>
