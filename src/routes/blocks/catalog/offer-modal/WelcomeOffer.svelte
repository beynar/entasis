<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Dialog } from 'svelai/dialog';
	import { Button } from 'svelai/button';
	import { Form } from 'svelai/form';
	import { Chip } from 'svelai/chip';
	let open = $state(false);
	let revealed = $state(false);
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<header class="flex flex-col gap-lg">
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">A warm welcome</p>
		<Heading size="h2" weight="bold">Your first good thing awaits.</Heading>
	</header>
	<Button class="self-start" variant="outline" onclick={() => (open = true)}
		>Open welcome offer</Button
	><Dialog bind:open title="A little welcome gift" description="Discover 15% off your first order."
		><div class="flex flex-col gap-xl">
			<Chip class="w-fit" variant="soft">For your first order</Chip><Heading size="h2"
				>Good things.<br />15% less.</Heading
			>
			<p class="text-neutral/65">
				Enter an email to preview the welcome offer. This example does not subscribe you to a
				mailing list.
			</p>
			{#if revealed}<div class="rounded-lg border border-dashed border-primary p-xl text-center">
					<p class="text-xs uppercase tracking-widest text-neutral/50">Your welcome code</p>
					<p class="mt-lg text-3xl font-semibold tracking-widest">WELCOME15</p>
				</div>{:else}<Form
					inputs={{
						email: {
							type: 'email',
							label: 'Email address',
							required: true,
							placeholder: 'you@example.com'
						}
					}}
					onSubmit={() => (revealed = true)}
					actions={[{ children: 'Reveal my code', onAction: (form) => form.submit() }]}
				/>{/if}<Button variant="ghost" color="neutral" size="small" onclick={() => (open = false)}
				>Maybe later</Button
			>
		</div></Dialog
	>
</section>
