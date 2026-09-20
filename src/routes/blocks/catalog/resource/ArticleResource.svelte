<script lang="ts">
	import { Heading } from 'entasis/heading';
	import { Avatar } from 'entasis/avatar';
	import { Button } from 'entasis/button';
	import { Chip } from 'entasis/chip';
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

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<article class="gap-xl mx-auto flex max-w-3xl flex-col">
		<Chip class="w-fit" variant="soft">Practical reading</Chip>
		<header class="gap-lg flex flex-col">
			<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
				Resource / Design practice
			</p>
			<Heading size="h2" weight="bold">Better questions make better interfaces.</Heading>
			<p class="text-neutral/65 max-w-2xl">
				A short guide to finding the real problem before choosing a solution.
			</p>
		</header>
		<div class="gap-lg flex flex-wrap items-center justify-between">
			<div class="gap-md flex items-center">
				<Avatar name="Maya Chen" />
				<div class="text-sm">
					<p>Maya Chen</p>
					<p class="text-neutral/65">7 min read · June 2026</p>
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
		<div class="bg-surface-recessed p-xl rounded-lg">
			<Heading size="h4">Three questions to begin with</Heading>
			<ol class="gap-lg mt-xl flex list-inside list-decimal flex-col">
				<li>What is the person trying to achieve?</li>
				<li>What gets in their way today?</li>
				<li>How will we know the experience improved?</li>
			</ol>
		</div>
		<p class="text-neutral/70 leading-relaxed">
			Write the answers in language that anyone on the team can understand. A useful problem
			statement should guide a decision without prescribing the interface.
		</p>
		{#if copyError}<p class="text-danger text-sm" role="alert">{copyError}</p>{/if}
	</article>
</section>
