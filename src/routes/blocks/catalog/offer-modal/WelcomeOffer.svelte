<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Dialog } from 'svelai/dialog';
	import { Button } from 'svelai/button';
	import { Form } from 'svelai/form';
	import { Chip } from 'svelai/chip';
	let open = $state(false);
	let revealed = $state(false);
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<header class="gap-lg flex flex-col">
		<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
			A warm welcome
		</p>
		<Heading size="h2" weight="bold">Your first good thing awaits.</Heading>
	</header>
	<Button class="self-start" variant="outline" onclick={() => (open = true)}
		>Open welcome offer</Button
	><Dialog bind:open title="A little welcome gift" description="Discover 15% off your first order."
		><div class="gap-xl flex flex-col">
			<Chip class="w-fit" variant="soft">For your first order</Chip><Heading size="h2"
				>Good things.<br />15% less.</Heading
			>
			<p class="text-neutral/65">
				Enter an email to preview the welcome offer. This example does not subscribe you to a
				mailing list.
			</p>
			{#if revealed}<div class="border-primary p-xl rounded-lg border border-dashed text-center">
					<p class="text-neutral/65 text-xs tracking-widest uppercase">Your welcome code</p>
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
