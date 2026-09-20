<script lang="ts">
	import { Stack } from 'entasis/stack';
	import { Avatar } from 'entasis/avatar';
	import { AvatarGroup } from 'entasis/avatar';
	import { Card } from 'entasis/card';
	import { Chip } from 'entasis/chip';
	import { Heading } from 'entasis/heading';
	import { Meter } from 'entasis/meter';
	import { Stat } from 'entasis/stat';
	import { targetIcon } from 'entasis/icons/target';
</script>

<section class="gap-xl p-lg md:p-xl flex flex-col">
	<Heading as="h2" size="h2" weight="bold">A shared space for your best work.</Heading>
	<div class="gap-lg grid md:grid-cols-3">
		<Card class="md:col-span-2" color="primary" variant="soft" title="Keep everyone in the loop"
			><div class="gap-xl flex flex-col">
				<p>One conversation, with all the context your team needs.</p>
				<Card title="Website launch" description="Design review · Today"
					><div class="gap-md flex flex-col">
						<div class="gap-md flex items-center">
							<Avatar name="Maya Chen" />
							<p class="text-sm">The final screens are ready for your review.</p>
						</div>
						<div class="flex justify-between">
							<Chip color="success" size="small">On track</Chip><AvatarGroup
								size="small"
								items={[{ name: 'Ari Costa' }, { name: 'Jules Bernard' }, { name: 'Maya Chen' }]}
							/>
						</div>
					</div></Card
				>
			</div></Card
		>
		<Card title="Momentum" description="Your week, at a glance"
			><Stack gap="lg"
				><Stat
					label="Tasks completed"
					value="28"
					trend="↑ 12 this week"
					trendDirection="up"
					variant="ghost"
				/><Meter label="Sprint progress" value={82} color="success" /></Stack
			></Card
		>
		<Card title="Built for focus" variant="outline"
			><div class="gap-lg flex flex-col">
				<span class="text-primary-readable">{@render targetIcon({ size: 32 })}</span>
				<p class="text-neutral/70">Group work by outcome. Make the next step obvious.</p>
			</div></Card
		>
		<Card class="md:col-span-2" variant="outline"
			><div class="gap-xl flex flex-wrap items-center justify-between">
				<div class="gap-sm flex flex-col">
					<Heading as="h3" size="h4">A place for every perspective.</Heading>
					<p class="text-neutral/70">Bring design, engineering, and product together.</p>
				</div>
				<AvatarGroup
					size="large"
					items={[
						{ name: 'Nora Ellis' },
						{ name: 'Ari Costa' },
						{ name: 'Maya Chen' },
						{ name: 'Theo Park' }
					]}
				/>
			</div></Card
		>
	</div>
</section>
