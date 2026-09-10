<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { NumberInput } from 'svelai/number-input';
	import { Separator } from 'svelai/separator';

	let lines = $state([
		{ name: 'Design discovery', rate: 120, unit: 'hour', quantity: 8 },
		{ name: 'Interface design', rate: 120, unit: 'hour', quantity: 24 },
		{ name: 'Prototype review', rate: 240, unit: 'session', quantity: 2 }
	]);
	let subtotal = $derived(lines.reduce((total, line) => total + line.quantity * line.rate, 0));
</script>

<Stack as="section" gap="lg" class="mx-auto w-full max-w-5xl p-md text-neutral sm:p-xl">
	<Card title="Invoice #INV-2026-048" description="Northstar Studio → Orbit Labs"
		><Stack gap="lg">
			<div class="flex flex-wrap justify-between gap-lg rounded-lg bg-surface-recessed p-lg">
				<div>
					<p class="text-xs text-neutral/60">BILL TO</p>
					<p class="mt-sm font-semibold">Orbit Labs</p>
					<p class="text-sm text-neutral/60">billing@example.com</p>
				</div>
				<div>
					<p class="text-xs text-neutral/60">DUE DATE</p>
					<p class="mt-sm font-semibold">July 15, 2026</p>
					<Chip color="warning" class="mt-sm">Draft</Chip>
				</div>
			</div>
			{#each lines as line (line)}<div
					class="grid items-center gap-md border-b border-neutral-muted pb-lg sm:grid-cols-[1fr_8rem_7rem_auto]"
				>
					<div>
						<strong>{line.name}</strong>
						<p class="text-sm text-neutral/60">${line.rate} per {line.unit}</p>
					</div>
					<NumberInput
						label={`Quantity: ${line.name}`}
						min={1}
						max={99}
						value={line.quantity}
						onValueChange={(quantity) => (line.quantity = quantity ?? 1)}
					/><strong class="tabular-nums">${(line.quantity * line.rate).toLocaleString()}</strong
					><Button
						label={`Remove ${line.name}`}
						size="small"
						variant="ghost"
						color="danger"
						onclick={() => (lines = lines.filter((candidate) => candidate !== line))}>Remove</Button
					>
				</div>{/each}<Button
				variant="outline"
				onclick={() =>
					(lines = [
						...lines,
						{ name: 'Additional design hours', rate: 120, unit: 'hour', quantity: 1 }
					])}>Add design hours</Button
			>
			<Stack gap="md" class="ml-auto w-full max-w-xs text-sm">
				<div class="flex justify-between">
					<span>Subtotal</span><strong>${subtotal.toLocaleString()}</strong>
				</div>
				<div class="flex justify-between">
					<span>Tax (10%)</span><strong>${(subtotal * 0.1).toLocaleString()}</strong>
				</div>
				<Separator />
				<div class="flex justify-between text-lg">
					<strong>Total</strong><strong>${(subtotal * 1.1).toLocaleString()}</strong>
				</div>
			</Stack>
			<p class="text-xs text-neutral/60">Local invoice preview. No invoice has been sent.</p>
		</Stack></Card
	>
</Stack>
