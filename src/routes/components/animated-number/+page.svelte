<script lang="ts">
	import { AnimatedNumber } from '$lib/components/AnimatedNumber/index.js';
	import type {
		AnimatedNumberTrend,
		AnimatedNumberVariant
	} from '$lib/components/AnimatedNumber/index.js';
	import Button from '$lib/components/Button/Button.svelte';
	import Stat from '$lib/components/Stat/Stat.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import DocPage from '../../DocPage.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';

	const variants: AnimatedNumberVariant[] = ['flow', 'blur'];
	const trends: AnimatedNumberTrend[] = ['auto', 'up', 'down', 'nearest'];

	const controls = createComponentControls([
		{ name: 'variant', type: 'segmented', label: 'Variant', value: 'flow', options: variants },
		{ name: 'trend', type: 'segmented', label: 'Trend', value: 'auto', options: trends },
		{
			name: 'continuous',
			type: 'switch',
			label: 'Continuous',
			value: false,
			visible: (value) => value.variant === 'flow'
		}
	]);

	const between = (min: number, max: number) => Math.round(min + Math.random() * (max - min));

	let visitors = $state(1284);

	let amount = $state(12480);
	let rate = $state(0.084);
	let followers = $state(18200);
	let distance = $state(42.5);

	let seconds = $state(42);
	let counter = $state(120);

	let score = $state(1204837);

	let seats = $state(3);
	const price = $derived(seats * 19);

	let revenue = $state(48250);
	let orders = $state(312);

	const reshuffle = () => {
		amount = between(900, 99000);
		rate = (Math.random() - 0.4) / 4;
		followers = between(800, 4200000);
		distance = between(5, 9000) / 10;
	};

	// Only what differs from the defaults is written in the Usage code.
	const usageProps = $derived(
		[
			controls.value.variant !== 'flow' && ` variant="${controls.value.variant}"`,
			controls.value.trend !== 'auto' && ` trend="${controls.value.trend}"`,
			controls.value.variant === 'flow' && controls.value.continuous && ' continuous'
		]
			.filter(Boolean)
			.join('')
	);
</script>

<DocPage
	title="Animated number"
	subtitle="A number that animates from the one it showed to the one it shows, digit by digit."
	component="AnimatedNumber"
	features={[
		'Digits turn like wheels, or are swapped through a blur',
		'Formats with Intl: currency, percent, units, compact notation',
		'Digits and symbols that join or leave the number fade and slide',
		'A change in the middle of another picks up where the number is',
		'Rendered as the plain number on the server',
		'Still under reduced motion',
		{
			label: 'Screen readers read the plain number, never a digit half way',
			test: 'a11y:animated-number.text'
		}
	]}
>
	<ComponentCard
		{controls}
		description="Give it a number. Every change is animated from the number it showed."
		class="mx-auto max-w-3xl"
		code={`<script>
	let visitors = $state(1284);
${'</' + 'script>'}

<AnimatedNumber value={visitors}${usageProps} class="text-5xl font-semibold" />
<Button onclick={() => (visitors += 37)}>Add visitors</Button>`}
	>
		<div class="flex w-full flex-col items-center gap-8 py-10">
			<AnimatedNumber
				value={visitors}
				variant={controls.value.variant as AnimatedNumberVariant}
				trend={controls.value.trend as AnimatedNumberTrend}
				continuous={controls.value.continuous}
				class="text-5xl font-semibold"
			/>
			<div class="flex flex-wrap justify-center gap-2">
				<Button variant="outline" onclick={() => (visitors -= between(1, 400))}>Remove</Button>
				<Button variant="outline" onclick={() => (visitors += 1)}>Add one</Button>
				<Button variant="outline" onclick={() => (visitors += between(1, 400))}>Add</Button>
				<Button variant="outline" onclick={() => (visitors = between(0, 2_000_000))}>
					Any number
				</Button>
			</div>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Variants"
			description="`flow` turns each digit like a wheel, through the digits in between. `blur` slides the new digit in and the old one out through a blur, and leaves the digits that did not change still."
			class="mx-auto max-w-4xl"
			code={`<AnimatedNumber value={score} />
<AnimatedNumber value={score} variant="blur" />`}
		>
			<div class="flex w-full flex-col items-center gap-8 py-8">
				<div class="grid w-full grid-cols-1 justify-items-center gap-8 md:grid-cols-2">
					{#each variants as variant (variant)}
						<div class="flex flex-col items-center gap-2">
							<AnimatedNumber value={score} {variant} class="text-4xl font-semibold" />
							<span class="text-neutral/70 text-sm">{variant}</span>
						</div>
					{/each}
				</div>
				<Button variant="outline" onclick={() => (score = between(100_000, 9_999_999))}>
					Randomize
				</Button>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Formatting"
			description="`format` takes the options of `Intl.NumberFormat`, and `locale` defaults to the I18n locale. Symbols are followed as digits are: a sign that appears fades in, a compact suffix that changes is crossed with the next one. `prefix` and `suffix` add text of your own."
			class="mx-auto max-w-4xl"
			code={`<AnimatedNumber
	value={amount}
	format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
/>
<AnimatedNumber
	value={rate}
	format={{ style: 'percent', maximumFractionDigits: 1, signDisplay: 'always' }}
/>
<AnimatedNumber value={followers} format={{ notation: 'compact' }} suffix=" followers" />
<AnimatedNumber
	value={distance}
	locale="fr"
	format={{ style: 'unit', unit: 'kilometer', minimumFractionDigits: 1 }}
/>`}
		>
			<div class="flex w-full flex-col items-center gap-8 py-8">
				<div
					class="grid w-full grid-cols-1 justify-items-center gap-8 text-3xl font-semibold md:grid-cols-2"
				>
					<AnimatedNumber
						value={amount}
						format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
					/>
					<AnimatedNumber
						value={rate}
						format={{ style: 'percent', maximumFractionDigits: 1, signDisplay: 'always' }}
					/>
					<AnimatedNumber value={followers} format={{ notation: 'compact' }} suffix=" followers" />
					<AnimatedNumber
						value={distance}
						locale="fr"
						format={{ style: 'unit', unit: 'kilometer', minimumFractionDigits: 1 }}
					/>
				</div>
				<Button variant="outline" onclick={reshuffle}>Randomize</Button>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Trend and continuous"
			description="`trend` is the way digits travel. `auto` follows the number, so a wheel never turns back while the number grows. `down` holds one way for a countdown. With `continuous`, every digit under the one that changed makes a whole turn, as if the number passed through all those in between."
			class="mx-auto max-w-4xl"
			code={`<!-- A countdown: always downwards -->
<AnimatedNumber value={seconds} trend="down" format={{ minimumIntegerDigits: 2 }} />

<!-- 120 to 220: the tens and the units turn too -->
<AnimatedNumber value={counter} continuous />`}
		>
			<div class="grid w-full grid-cols-1 justify-items-center gap-10 py-8 md:grid-cols-2">
				<div class="flex flex-col items-center gap-4">
					<AnimatedNumber
						value={seconds}
						trend="down"
						format={{ minimumIntegerDigits: 2 }}
						class="text-4xl font-semibold"
					/>
					<Button variant="outline" onclick={() => (seconds = seconds > 0 ? seconds - 1 : 59)}>
						One second less
					</Button>
				</div>
				<div class="flex flex-col items-center gap-4">
					<AnimatedNumber value={counter} continuous class="text-4xl font-semibold" />
					<div class="flex gap-2">
						<Button variant="outline" onclick={() => (counter -= 100)}>-100</Button>
						<Button variant="outline" onclick={() => (counter += 100)}>+100</Button>
					</div>
				</div>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Blur and pace"
			description="`duration` is how long a change takes. With `blur`, the `blur` prop is the blur a changing digit passes through, in pixels, and `--animated-number-distance` how far it travels."
			class="mx-auto max-w-4xl"
			code={`<AnimatedNumber value={score} variant="blur" blur={8} duration={320} />
<AnimatedNumber value={score} variant="blur" blur={21} duration={560} />
<AnimatedNumber value={score} variant="blur" blur={0} class="[--animated-number-distance:1em]" />`}
		>
			<div class="flex w-full flex-col items-center gap-8 py-8">
				<div class="grid w-full grid-cols-1 justify-items-center gap-8 md:grid-cols-3">
					<div class="flex flex-col items-center gap-2">
						<AnimatedNumber
							value={score}
							variant="blur"
							blur={8}
							duration={320}
							class="text-3xl font-semibold"
						/>
						<span class="text-neutral/70 text-sm">8px, 320ms</span>
					</div>
					<div class="flex flex-col items-center gap-2">
						<AnimatedNumber
							value={score}
							variant="blur"
							blur={21}
							duration={560}
							class="text-3xl font-semibold"
						/>
						<span class="text-neutral/70 text-sm">21px, 560ms</span>
					</div>
					<div class="flex flex-col items-center gap-2">
						<AnimatedNumber
							value={score}
							variant="blur"
							blur={0}
							class="text-3xl font-semibold [--animated-number-distance:1em]"
						/>
						<span class="text-neutral/70 text-sm">no blur, a longer way</span>
					</div>
				</div>
				<Button variant="outline" onclick={() => (score = between(100_000, 9_999_999))}>
					Randomize
				</Button>
			</div>
		</ComponentCard>

		<ComponentCard
			title="A price that follows a choice"
			description="The theme styles the runs of the number: here the cents are smaller and the currency quieter."
			class="mx-auto max-w-3xl"
			code={`<AnimatedNumber
	value={seats * 19}
	format={{ style: 'currency', currency: 'USD' }}
	class="text-5xl font-semibold"
	theme={{ fraction: { base: 'text-2xl' }, pre: { base: 'text-neutral/70' } }}
/>`}
		>
			<div class="flex w-full flex-col items-center gap-6 py-8">
				<div class="flex items-baseline gap-2">
					<AnimatedNumber
						value={price}
						format={{ style: 'currency', currency: 'USD' }}
						class="text-5xl font-semibold"
						theme={{ fraction: { base: 'text-2xl' }, pre: { base: 'text-neutral/70' } }}
					/>
					<span class="text-neutral/70 text-sm">per month</span>
				</div>
				<div class="flex items-center gap-3">
					<Button variant="outline" disabled={seats <= 1} onclick={() => seats--}>-</Button>
					<span class="w-20 text-center text-sm">
						<AnimatedNumber value={seats} variant="blur" />
						{seats === 1 ? 'seat' : 'seats'}
					</span>
					<Button variant="outline" onclick={() => seats++}>+</Button>
				</div>
			</div>
		</ComponentCard>

		<ComponentCard
			title="In a stat"
			description="Pass it as the value of a Stat for a figure that is kept up to date."
			class="mx-auto max-w-4xl"
			code={`<Stat label="Revenue">
	{#snippet value()}
		<AnimatedNumber
			value={revenue}
			format={{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }}
		/>
	{/snippet}
</Stat>`}
		>
			<div class="flex w-full flex-col items-center gap-6 py-4">
				<div class="grid w-full max-w-xl grid-cols-1 gap-4 md:grid-cols-2">
					<Stat label="Revenue" description="Today">
						{#snippet value()}
							<AnimatedNumber
								value={revenue}
								format={{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }}
							/>
						{/snippet}
					</Stat>
					<Stat label="Orders" description="Today">
						{#snippet value()}
							<AnimatedNumber value={orders} variant="blur" />
						{/snippet}
					</Stat>
				</div>
				<Button
					variant="outline"
					onclick={() => {
						const sold = between(1, 9);
						orders += sold;
						revenue += sold * between(40, 260);
					}}
				>
					New orders
				</Button>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
