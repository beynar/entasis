<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Accordion } from 'svelai/accordion';
	import { Button } from 'svelai/button';
	import { Chip } from 'svelai/chip';
	const groups = [
		{ title: 'Shop', links: ['New arrivals', 'Lighting', 'Objects', 'Everyday carry'] },
		{ title: 'Help', links: ['Delivery & returns', 'Care guide', 'FAQs', 'Contact'] },
		{ title: 'Field', links: ['Our story', 'Journal', 'Materials', 'Stockists'] }
	];
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<footer class="flex flex-col gap-xl">
		<div class="grid items-center gap-xl rounded-lg bg-primary-muted p-xl sm:grid-cols-[1fr_auto]">
			<div>
				<Heading size="h3">A little inspiration for your inbox.</Heading>
				<p class="mt-lg text-neutral/65">
					Explore the latest stories, collections, and things we think you will like.
				</p>
			</div>
			<Button href="/docs">Read the latest issue ↗</Button>
		</div>
		<div class="grid gap-xl md:grid-cols-[1fr_2fr]">
			<div class="flex flex-col gap-xl">
				<a href="/components" class="text-3xl font-semibold tracking-widest">FIELD</a>
				<p class="max-w-xs text-neutral/60">Everyday objects.<br />Extraordinary attention.</p>
				<div class="flex gap-md">
					<Chip size="small" variant="soft" color="neutral">Visa</Chip><Chip
						size="small"
						variant="soft"
						color="neutral">Mastercard</Chip
					><Chip size="small" variant="soft" color="neutral">Apple Pay</Chip>
				</div>
			</div>
			<Accordion items={groups}
				>{#snippet content({ item: group })}<nav
						aria-label={group.title}
						class="grid grid-cols-2 gap-lg"
					>
						{#each group.links as link (link)}<a
								href="/docs"
								class="text-sm text-neutral/65 hover:text-primary">{link} ↗</a
							>{/each}
					</nav>{/snippet}</Accordion
			>
		</div>
		<p class="border-t border-neutral/15 pt-xl text-xs text-neutral/50">
			© 2026 Field Objects. Made with care.
		</p>
	</footer>
</section>
