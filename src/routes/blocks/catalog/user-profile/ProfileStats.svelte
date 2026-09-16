<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Alert } from 'svelai/alert';
	import { Avatar } from 'svelai/avatar';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';

	let following = $state(false);
	let contact = $state(false);
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<Card class="mx-auto w-full max-w-xl"
		><div class="gap-lg grid justify-items-center text-center">
			<Avatar name="Alex Morgan" size="large" />
			<div>
				<h2 class="text-2xl font-semibold">Alex Morgan</h2>
				<p class="mt-sm text-neutral/70 text-sm">Product designer · Paris, France</p>
			</div>
			<p class="text-neutral/65 max-w-sm text-sm leading-relaxed">
				I make complex things feel simple. Currently helping thoughtful teams find their next great
				idea.
			</p>
			<div class="gap-sm bg-surface-recessed p-lg grid w-full grid-cols-3 rounded-lg">
				<div>
					<strong class="text-xl">24</strong>
					<p class="text-neutral/70 text-xs">Projects</p>
				</div>
				<div>
					<strong class="text-xl">{following ? '1,249' : '1,248'}</strong>
					<p class="text-neutral/70 text-xs">Followers</p>
				</div>
				<div>
					<strong class="text-xl">186</strong>
					<p class="text-neutral/70 text-xs">Following</p>
				</div>
			</div>
			<Stack orientation="horizontal" wrap="wrap" gap="md">
				<Button onclick={() => (following = !following)}
					>{following ? 'Following' : 'Follow'}</Button
				><Button variant="outline" onclick={() => (contact = !contact)}
					>{contact ? 'Hide contact' : 'Contact'}</Button
				>
			</Stack>
			{#if contact}<Alert
					color="info"
					title="Contact Alex"
					description="alex@example.com · Sample contact information"
				/>{/if}
		</div></Card
	>
</Stack>
