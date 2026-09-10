<script lang="ts">
	import { AvatarGroup } from 'svelai/avatar';
	import { Button } from 'svelai/button';
	import { Heading } from 'svelai/heading';
	import { Separator } from 'svelai/separator';
	import { Stat } from 'svelai/stat';
</script>

<section class="mx-auto grid max-w-6xl gap-xl p-lg md:grid-cols-3 md:p-xl">
	<aside class="flex flex-col gap-lg md:sticky md:top-0 md:self-start">
		<Heading as="h2" size="h3">Northstar®</Heading>
		<p class="text-neutral/60">Independent product studio.<br />Paris · Everywhere.</p>
		<Separator />
		<dl class="grid grid-cols-2 gap-md text-sm">
			<dt class="text-neutral/60">Established</dt>
			<dd>2019</dd>
			<dt class="text-neutral/60">Team</dt>
			<dd>24 people</dd>
			<dt class="text-neutral/60">Focus</dt>
			<dd>Digital products</dd>
		</dl>
		<Button href="/components" variant="outline">See our work</Button>
	</aside>
	<div class="flex flex-col gap-xl md:col-span-2">
		<Heading as="h3" size="h1" weight="bold">An independent spirit. A shared direction.</Heading>
		<p class="text-lg text-neutral/70">
			We work at the intersection of design and engineering. We bring the right people together, ask
			better questions, and turn a promising idea into something useful.
		</p>
		<div class="grid gap-md sm:grid-cols-3">
			<Stat label="Products launched" value="42" /><Stat label="Years together" value="7" /><Stat
				label="Time zones"
				value="6"
			/>
		</div>
		<Heading as="h4" size="h4">Small by design</Heading>
		<p class="text-neutral/70">
			Our teams stay close to the work. The people you meet at the beginning are the people making
			the decisions, writing the code, and polishing the final details.
		</p>
		<div class="flex items-center gap-md">
			<AvatarGroup
				items={[{ name: 'Maya Chen' }, { name: 'Jules Bernard' }, { name: 'Ari Costa' }]}
			/><span class="text-sm text-neutral/60">Different perspectives. One team.</span>
		</div>
	</div>
</section>
