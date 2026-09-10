<script lang="ts">
	import { Form } from 'svelai/form';
	import { Heading } from 'svelai/heading';
	import { Separator } from 'svelai/separator';
	let email = $state('');
</script>

<footer class="flex flex-col gap-xl border-t border-neutral-muted p-lg md:p-xl">
	<div class="grid gap-xl md:grid-cols-2">
		<div class="flex max-w-md flex-col gap-lg">
			<Heading as="h2" size="h3">A note for curious minds.</Heading>
			<p class="text-sm text-neutral/70">
				Product ideas, useful patterns, and small things worth noticing.
			</p>
			<Form
				inputs={{ email: { type: 'email', label: 'Email address', required: true } }}
				onSubmit={(values) => (email = values.email ?? '')}
				actions={[
					{ children: 'Review subscription', variant: 'outline', onAction: (form) => form.submit() }
				]}
			/>
			<p class="text-xs text-neutral/50">Local preview only; this example sends no subscription.</p>
			{#if email}<p class="text-sm text-primary" role="status">
					Subscription draft for {email}
				</p>{/if}
		</div>
		<div class="grid grid-cols-2 gap-xl">
			<nav aria-label="Product links" class="flex flex-col items-start gap-lg">
				<strong>Build</strong><a href="/components" class="text-sm text-neutral/60 hover:underline"
					>Components</a
				><a href="/blocks" class="text-sm text-neutral/60 hover:underline">Blocks</a><a
					href="/colors"
					class="text-sm text-neutral/60 hover:underline">Color system</a
				>
			</nav>
			<nav aria-label="Learning links" class="flex flex-col items-start gap-lg">
				<strong>Learn</strong><a href="/docs" class="text-sm text-neutral/60 hover:underline"
					>Getting started</a
				><a href="/components/form" class="text-sm text-neutral/60 hover:underline">Forms</a><a
					href="/docs"
					class="text-sm text-neutral/60 hover:underline">Theming</a
				>
			</nav>
		</div>
	</div>
	<Separator />
	<div class="flex flex-wrap items-center justify-between gap-lg">
		<strong class="text-2xl">Northstar®</strong><span class="text-xs text-neutral/50"
			>Good ideas, made useful.</span
		>
	</div>
</footer>
