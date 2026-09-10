<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Avatar } from 'svelai/avatar';
	import { Card } from 'svelai/card';
	import { Heading } from 'svelai/heading';
	import { Rating } from 'svelai/rating';
</script>

<section class="flex flex-col gap-xl p-lg md:p-xl">
	<div class="flex flex-wrap items-end justify-between gap-lg">
		<Heading as="h2" size="h2" weight="bold">Good work is a shared experience.</Heading>
		<p class="text-xs text-neutral/50">Illustrative customer stories</p>
	</div>
	<div class="grid gap-lg md:grid-cols-3">
		<Card variant="soft" color="primary" class="md:col-span-2"
			><div class="flex min-h-80 flex-col justify-between gap-xl">
				<span class="text-2xl font-semibold">✳ Layers</span>
				<blockquote class="text-2xl leading-relaxed">
					“We finally had a shared place for the context. The decisions got clearer, the reviews got
					shorter, and the work got better.”
				</blockquote>
				<div class="flex items-center gap-md">
					<Avatar user={{ name: 'Jules Bernard' }} />
					<div>
						<strong>Jules Bernard</strong>
						<p class="text-sm text-neutral/60">Design director · Layers</p>
					</div>
				</div>
			</div></Card
		>
		<div class="flex flex-col gap-lg">
			<Card variant="outline"
				><Stack gap="lg"
					><Rating value={5} size="small" />
					<blockquote>
						“A thoughtful foundation gave our small team room to be ambitious.”
					</blockquote>
					<p class="text-sm text-neutral/60">Nora Ellis · Quotient</p></Stack
				></Card
			><Card variant="outline"
				><Stack gap="lg"
					><Rating value={5} size="small" />
					<blockquote>“The next step stopped being a guessing game.”</blockquote>
					<p class="text-sm text-neutral/60">Ari Costa · Capsule</p></Stack
				></Card
			>
		</div>
	</div>
</section>
