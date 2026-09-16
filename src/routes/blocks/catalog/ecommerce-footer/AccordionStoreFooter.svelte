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

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<footer class="gap-xl flex flex-col">
		<div class="gap-xl bg-primary-muted p-xl grid items-center rounded-lg sm:grid-cols-[1fr_auto]">
			<div>
				<Heading size="h3">A little inspiration for your inbox.</Heading>
				<p class="mt-lg text-neutral/65">
					Explore the latest stories, collections, and things we think you will like.
				</p>
			</div>
			<Button href="/docs">Read the latest issue ↗</Button>
		</div>
		<div class="gap-xl grid md:grid-cols-[1fr_2fr]">
			<div class="gap-xl flex flex-col">
				<a href="/components" class="text-3xl font-semibold tracking-widest">FIELD</a>
				<p class="text-neutral/70 max-w-xs">Everyday objects.<br />Extraordinary attention.</p>
				<div class="gap-md flex">
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
						class="gap-lg grid grid-cols-2"
					>
						{#each group.links as link (link)}<a
								href="/docs"
								class="text-neutral/65 hover:text-primary-readable text-sm">{link} ↗</a
							>{/each}
					</nav>{/snippet}</Accordion
			>
		</div>
		<p class="border-neutral/15 pt-xl text-neutral/65 border-t text-xs">
			© 2026 Field Objects. Made with care.
		</p>
	</footer>
</section>
