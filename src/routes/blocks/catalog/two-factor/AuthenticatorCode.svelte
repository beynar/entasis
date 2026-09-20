<script lang="ts">
	import { Stack } from 'entasis/stack';
	import { Alert } from 'entasis/alert';
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { Chip } from 'entasis/chip';
	import { Form } from 'entasis/form';

	let message = $state('');
	let recovery = $state(false);
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<Card
		class="mx-auto w-full max-w-md"
		title="One more step"
		description="Enter the code from your authenticator app."
		><Stack gap="lg">
			<Chip color="primary">Two-step verification</Chip><Form
				inputs={recovery
					? {
							code: {
								type: 'text',
								label: 'Recovery code',
								required: true,
								onValidate: (value) =>
									value === 'DEMO-2026' ? false : 'Use DEMO-2026 for this preview.'
							}
						}
					: {
							code: {
								type: 'pin',
								label: 'Authentication code',
								length: 6,
								required: true,
								onValidate: (value) => (value === '123456' ? false : 'Use 123456 for this preview.')
							}
						}}
				actions={[
					{ children: 'Verify preview', fullWidth: true, onAction: (form) => form.submit() }
				]}
				onSubmit={() => (message = 'Demo code verified. No account session was created.')}
			/>
			<p class="text-neutral/70 text-xs">Demo code: {recovery ? 'DEMO-2026' : '123456'}</p>
			<Button
				variant="link"
				onclick={() => {
					recovery = !recovery;
					message = '';
				}}>{recovery ? 'Use authenticator instead' : 'Use a recovery code'}</Button
			>{#if message}<Alert
					color="info"
					variant="soft"
					title="Demo result"
					description={message}
				/>{/if}
		</Stack></Card
	>
</Stack>
