<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Alert } from 'svelai/alert';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { fingerprintIcon } from 'svelai/icons/fingerprint';
	let message = $state('');
	let fallback = $state(false);
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<Card
		class="mx-auto w-full max-w-md"
		title="Sign in with a passkey"
		description="A familiar gesture. A more secure sign-in."
		><Stack gap="lg" class="text-center">
			<div class="bg-primary-muted mx-auto grid size-20 place-items-center rounded-full text-4xl">
				{@render fingerprintIcon()}
			</div>
			<p class="text-neutral/65 text-sm">
				Use your fingerprint, face, or device PIN to access Northstar.
			</p>
			<Button onclick={() => (message = 'Passkey sign-in is not available in this demo.')}
				>Continue with passkey</Button
			><Button color="neutral" variant="ghost" onclick={() => (fallback = !fallback)}
				>Other sign-in options</Button
			>{#if fallback}<Alert
					title="Email sign-in"
					description="Use a verified email link when your saved passkey is unavailable."
				/>{/if}{#if message}<Alert
					color="info"
					variant="soft"
					title="Demo result"
					description={message}
				/>{/if}
		</Stack></Card
	>
</Stack>
