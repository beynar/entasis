<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import { Countdown } from '$lib/components/Countdown/index.js';
	import { Stat } from '$lib/components/Stat/index.js';
	import { Progress } from '$lib/components/Progress/index.js';
	import { Button } from '$lib/components/Button/index.js';
	import { hourglassIcon } from '$lib/components/Icons/hourglass.js';

	const SECOND = 1000;
	const MINUTE = 60 * SECOND;
	const HOUR = 60 * MINUTE;
	const DAY = 24 * HOUR;

	const controls = createComponentControls([
		{
			name: 'format',
			type: 'segmented',
			label: 'Format',
			value: 'relative',
			options: ['relative', 'clock']
		},
		{
			name: 'units',
			type: 'slider',
			label: 'Units',
			value: 2,
			min: 1,
			max: 4,
			step: 1,
			showValue: true,
			visible: (value) => value.format === 'relative'
		}
	]);

	const loadedAt = Date.now();
	const resumeAt = new Date(loadedAt + 3 * DAY + 4 * HOUR + 12 * MINUTE + 30 * SECOND);
	const clockAt = new Date(loadedAt + 2 * HOUR + 14 * MINUTE + 5 * SECOND);
	const pausedAt = new Date(loadedAt - 20 * SECOND);
	const shortResumeAt = new Date(loadedAt + 40 * SECOND);

	const usageCode = $derived(
		controls.value.format === 'clock'
			? `<Countdown until={resumeAt} format="clock" />`
			: `<Countdown until={resumeAt} units={${controls.value.units}} />`
	);

	const locales = ['en', 'fr', 'de', 'es', 'ja', 'ar'] as const;

	let restartAt = $state(Date.now() + 10 * SECOND);
	let completions = $state(0);
</script>

<DocPage
	title="Countdown"
	subtitle="Time left until a moment, as localized words or a compact clock, updated only when the text changes."
	component="Countdown"
	features={[
		'Intl formatting in the active locale, no catalog strings',
		'One timer aimed at the next unit boundary',
		'Resyncs when the page becomes visible',
		'time element with role timer',
		'Payload snippet with remaining parts and fraction'
	]}
>
	<ComponentCard
		{controls}
		description="The time left before a paused run resumes."
		code={`<script>
	import { Countdown } from 'entasis/countdown';

	const resumeAt = new Date(Date.now() + 3 * 86_400_000 + 4 * 3_600_000);
${'</' + 'script>'}

${usageCode}`}
	>
		<p class="text-lg">
			Resumes in
			<Countdown
				until={controls.value.format === 'clock' ? clockAt : resumeAt}
				format={controls.value.format}
				units={controls.value.units}
				class="font-semibold"
			/>
		</p>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Units"
			description="units counts from the largest non-zero unit. Smaller units are truncated and zero units are left out, so the text only changes at the boundary of its smallest shown unit."
			class="!min-h-fit"
			code={`<Countdown until={resumeAt} />
<Countdown until={resumeAt} units={2} />
<Countdown until={resumeAt} units={3} />
<Countdown until={resumeAt} units={4} />`}
		>
			<dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
				{#each [1, 2, 3, 4] as units (units)}
					<dt class="text-neutral/70">units={units}</dt>
					<dd><Countdown until={resumeAt} {units} /></dd>
				{/each}
			</dl>
		</ComponentCard>

		<ComponentCard
			title="Clock"
			description="The clock format reads hours, minutes and seconds, with the days in front when there are any. Screen readers hear every unit in words instead of the digits."
			class="!min-h-fit"
			code={`<Countdown until={clockAt} format="clock" />
<Countdown until={resumeAt} format="clock" />`}
		>
			<div class="flex flex-wrap items-center gap-8 text-2xl font-semibold">
				<Countdown until={clockAt} format="clock" />
				<Countdown until={resumeAt} format="clock" />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Locales"
			description="The text comes from Intl in the I18n locale. The locale prop overrides it for one countdown."
			class="!min-h-fit"
			code={`<Countdown until={resumeAt} units={2} locale="fr" />`}
		>
			<dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
				{#each locales as locale (locale)}
					<dt class="text-neutral/70 font-mono">{locale}</dt>
					<dd><Countdown until={resumeAt} units={2} {locale} /></dd>
				{/each}
			</dl>
		</ComponentCard>

		<ComponentCard
			title="Inside a Stat"
			description="Stat's value is a Slot, so the countdown takes the Stat's value typography."
			class="!min-h-fit"
			code={`<Stat label="Resumes in" description="Sleep step · run #4821">
	{#snippet value()}
		<Countdown until={resumeAt} units={2} />
	{/snippet}
	{#snippet indicator()}
		{@render hourglassIcon()}
	{/snippet}
</Stat>`}
		>
			<Stat label="Resumes in" description="Sleep step · run #4821" class="w-full max-w-sm">
				{#snippet value()}
					<Countdown until={resumeAt} units={2} />
				{/snippet}
				{#snippet indicator()}
					{@render hourglassIcon()}
				{/snippet}
			</Stat>
		</ComponentCard>

		<ComponentCard
			title="Custom rendering with progress"
			description="children receives the payload. With from, fraction is the elapsed share of from → until, ready for a Progress."
			class="!min-h-fit"
			code={`<Countdown until={resumeAt} from={pausedAt} units={2}>
	{#snippet children({ label, fraction, done })}
		<Progress
			value={(fraction ?? 0) * 100}
			label={done ? 'Resumed' : \`Resumes in \${label}\`}
			showValue
		/>
	{/snippet}
</Countdown>`}
		>
			<Countdown until={shortResumeAt} from={pausedAt} units={2} class="block w-full max-w-sm">
				{#snippet children({ label, fraction, done })}
					<Progress
						value={(fraction ?? 0) * 100}
						label={done ? 'Resumed' : `Resumes in ${label}`}
						showValue
					/>
				{/snippet}
			</Countdown>
		</ComponentCard>

		<ComponentCard
			title="Completion"
			description="Once reached, the countdown reads the localized “now” and calls onComplete once. A new until re-arms it."
			class="!min-h-fit"
			code={`<Countdown until={restartAt} format="clock" onComplete={() => completions++} />
<Button onclick={() => (restartAt = Date.now() + 10_000)}>Restart</Button>`}
		>
			<div class="flex flex-wrap items-center gap-6">
				<Countdown
					until={restartAt}
					format="clock"
					class="text-2xl font-semibold"
					onComplete={() => completions++}
				/>
				<Button variant="outline" onclick={() => (restartAt = Date.now() + 10 * SECOND)}>
					Restart
				</Button>
				<span class="text-neutral/70 text-sm">onComplete calls: {completions}</span>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
