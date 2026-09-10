<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Alert } from 'svelai/alert';
	import { Form } from 'svelai/form';

	let message = $state('');
</script>

<Stack as="section" gap="lg" class="mx-auto w-full max-w-5xl p-md text-neutral sm:p-xl">
	<div class="grid gap-xl md:grid-cols-3">
		<aside>
			<p class="text-sm text-primary-readable">Companies / New</p>
			<h2 class="mt-md text-3xl font-semibold">Know who you work with.</h2>
			<p class="mt-md text-sm text-neutral/60">Keep the company and its main contact together.</p>
		</aside>
		<div class="grid gap-lg md:col-span-2">
			<Form
				variant="sectioned"
				inputs={{
					company: {
						type: 'group',
						label: 'Company details',
						description: 'The essentials about this organization.',
						columns: 2,
						inputs: {
							name: { type: 'text', label: 'Company name', required: true },
							website: { type: 'url', label: 'Website', placeholder: 'https://example.com' },
							industry: {
								type: 'select',
								label: 'Industry',
								items: [
									{ value: 'software', label: 'Software' },
									{ value: 'design', label: 'Design' },
									{ value: 'retail', label: 'Retail' }
								]
							},
							size: {
								type: 'select',
								label: 'Company size',
								items: [
									{ value: '1-10', label: '1–10 employees' },
									{ value: '11-50', label: '11–50 employees' },
									{ value: '51-200', label: '51–200 employees' }
								]
							}
						}
					},
					contact: {
						type: 'group',
						label: 'Primary contact',
						columns: 2,
						inputs: {
							contactName: { type: 'text', label: 'Contact name', required: true },
							email: { type: 'email', label: 'Contact email', required: true }
						}
					},
					notes: { type: 'textarea', label: 'Notes', placeholder: 'Anything useful for your team…' }
				}}
				actions={[{ children: 'Save company locally', onAction: (form) => form.submit() }]}
				onSubmit={({ name, email }) =>
					(message = `${name} saved in this preview with ${email} as its contact.`)}
			/>{#if message}<Alert
					color="info"
					variant="soft"
					title="Demo result"
					description={message}
				/>{/if}
		</div>
	</div>
</Stack>
