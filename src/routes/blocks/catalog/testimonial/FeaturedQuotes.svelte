<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Avatar } from 'svelai/avatar';
	import { Card } from 'svelai/card';
	import { Heading } from 'svelai/heading';
	import { Rating } from 'svelai/rating';
</script>

<section class="gap-xl p-lg md:p-xl flex flex-col">
	<div class="gap-lg flex flex-wrap items-end justify-between">
		<Heading as="h2" size="h2" weight="bold">Good work is a shared experience.</Heading>
		<p class="text-neutral/65 text-xs">Illustrative customer stories</p>
	</div>
	<div class="gap-lg grid md:grid-cols-3">
		<Card variant="soft" color="primary" class="md:col-span-2"
			><div class="gap-xl flex min-h-80 flex-col justify-between">
				<span class="text-2xl font-semibold">✳ Layers</span>
				<blockquote class="text-2xl leading-relaxed">
					“We finally had a shared place for the context. The decisions got clearer, the reviews got
					shorter, and the work got better.”
				</blockquote>
				<div class="gap-md flex items-center">
					<Avatar name="Jules Bernard" />
					<div>
						<strong>Jules Bernard</strong>
						<p class="text-neutral/70 text-sm">Design director · Layers</p>
					</div>
				</div>
			</div></Card
		>
		<div class="gap-lg flex flex-col">
			<Card variant="outline"
				><Stack gap="lg"
					><Rating value={5} size="small" />
					<blockquote>
						“A thoughtful foundation gave our small team room to be ambitious.”
					</blockquote>
					<p class="text-neutral/70 text-sm">Nora Ellis · Quotient</p></Stack
				></Card
			><Card variant="outline"
				><Stack gap="lg"
					><Rating value={5} size="small" />
					<blockquote>“The next step stopped being a guessing game.”</blockquote>
					<p class="text-neutral/70 text-sm">Ari Costa · Capsule</p></Stack
				></Card
			>
		</div>
	</div>
</section>
