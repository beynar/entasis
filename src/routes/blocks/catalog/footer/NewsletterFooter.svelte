<script lang="ts">
	import { Form } from 'entasis/form';
	import { Heading } from 'entasis/heading';
	import { Separator } from 'entasis/separator';
	let email = $state('');
</script>

<footer class="gap-xl border-neutral-muted p-lg md:p-xl flex flex-col border-t">
	<div class="gap-xl grid md:grid-cols-2">
		<div class="gap-lg flex max-w-md flex-col">
			<Heading as="h2" size="h3">A note for curious minds.</Heading>
			<p class="text-neutral/70 text-sm">
				Product ideas, useful patterns, and small things worth noticing.
			</p>
			<Form
				inputs={{ email: { type: 'email', label: 'Email address', required: true } }}
				onSubmit={(values) => (email = values.email ?? '')}
				actions={[
					{ children: 'Review subscription', variant: 'outline', onAction: (form) => form.submit() }
				]}
			/>
			<p class="text-neutral/65 text-xs">Local preview only; this example sends no subscription.</p>
			{#if email}<p class="text-primary-readable text-sm" role="status">
					Subscription draft for {email}
				</p>{/if}
		</div>
		<div class="gap-xl grid grid-cols-2">
			<nav aria-label="Product links" class="gap-lg flex flex-col items-start">
				<strong>Build</strong><a href="/components" class="text-neutral/70 text-sm hover:underline"
					>Components</a
				><a href="/blocks" class="text-neutral/70 text-sm hover:underline">Blocks</a><a
					href="/colors"
					class="text-neutral/70 text-sm hover:underline">Color system</a
				>
			</nav>
			<nav aria-label="Learning links" class="gap-lg flex flex-col items-start">
				<strong>Learn</strong><a href="/docs" class="text-neutral/70 text-sm hover:underline"
					>Getting started</a
				><a href="/components/form" class="text-neutral/70 text-sm hover:underline">Forms</a><a
					href="/docs"
					class="text-neutral/70 text-sm hover:underline">Theming</a
				>
			</nav>
		</div>
	</div>
	<Separator />
	<div class="gap-lg flex flex-wrap items-center justify-between">
		<strong class="text-2xl">Northstar®</strong><span class="text-neutral/65 text-xs"
			>Good ideas, made useful.</span
		>
	</div>
</footer>
