<script lang="ts">
	import { Grid } from 'svelai/grid';
	import { Stack } from 'svelai/stack';
	import { Alert } from 'svelai/alert';
	import { Avatar } from 'svelai/avatar';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Form } from 'svelai/form';
	import { Separator } from 'svelai/separator';

	let message = $state('');
</script>

<Stack as="section" gap="lg" class="mx-auto w-full max-w-5xl p-md text-neutral sm:p-xl">
	<div class="grid gap-xl md:grid-cols-3">
		<Card class="md:col-span-1"
			><Stack gap="lg">
				<Avatar user={{ name: 'Sam Rivera' }} size="large" /><Chip color="success"
					>Available for select projects</Chip
				>
				<h2 class="text-3xl font-semibold">Sam Rivera</h2>
				<p class="text-sm text-primary-readable">Independent designer & developer</p>
				<p class="text-sm leading-relaxed text-neutral/65">
					I help early teams turn ambitious ideas into thoughtful digital products.
				</p>
				<Separator />
				<div class="flex flex-wrap justify-between gap-sm text-sm">
					<span class="text-neutral/60">Based in</span><strong>Barcelona, ES</strong>
				</div>
				<div class="flex flex-wrap justify-between gap-sm text-sm">
					<span class="text-neutral/60">Experience</span><strong>8 years</strong>
				</div>
			</Stack></Card
		>
		<div class="grid gap-lg md:col-span-2">
			<Card title="How I can help"
				><Grid columns={{ minWidth: 220, max: 2 }} gap="lg">
					<div>
						<h3 class="font-semibold">Product design</h3>
						<p class="mt-sm text-sm text-neutral/65">
							Strategy, prototypes, and interfaces that make sense.
						</p>
					</div>
					<div>
						<h3 class="font-semibold">Web development</h3>
						<p class="mt-sm text-sm text-neutral/65">
							Accessible, responsive products built with care.
						</p>
					</div>
				</Grid></Card
			><Card
				title="Tell me about your project"
				description="Prepare an inquiry in this local preview."
				><Stack gap="lg"
					><Form
						inputs={{
							name: { type: 'text', label: 'Your name', required: true },
							email: { type: 'email', label: 'Your email', required: true },
							scope: {
								type: 'select',
								label: 'Project focus',
								required: true,
								items: [
									{ value: 'design', label: 'Product design' },
									{ value: 'development', label: 'Web development' },
									{ value: 'both', label: 'Design and development' }
								]
							},
							message: { type: 'textarea', label: 'What are you working on?', required: true }
						}}
						actions={[{ children: 'Prepare inquiry', onAction: (form) => form.submit() }]}
						onSubmit={({ name }) =>
							(message = `Inquiry from ${name} prepared locally. No message was sent.`)}
					/>{#if message}<Alert
							color="info"
							variant="soft"
							title="Demo result"
							description={message}
						/>{/if}</Stack
				></Card
			>
		</div>
	</div>
</Stack>
