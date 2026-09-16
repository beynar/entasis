<script lang="ts">
	import DocPage from '../../DocPage.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import Meter from '$lib/components/Meter/Meter.svelte';
	import Separator from '$lib/components/Separator/Separator.svelte';
	import { gearIcon } from '$lib/components/Icons/gear.js';
	import { appWindowIcon } from '$lib/components/Icons/appWindow.js';
	import { fileTextIcon } from '$lib/components/Icons/fileText.js';
	import { filmStripIcon } from '$lib/components/Icons/filmStrip.js';

	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: ['small', 'normal', 'large']
		},
		{
			name: 'color',
			type: 'segmented',
			label: 'Color',
			value: 'primary',
			options: ['primary', 'success', 'warning', 'danger', 'info']
		},
		{
			name: 'indicator',
			type: 'segmented',
			label: 'Indicator',
			value: 'percentage',
			options: ['percentage', 'value', 'hidden']
		},
		{
			name: 'value',
			type: 'slider',
			label: 'Value',
			value: 65,
			min: 0,
			max: 100,
			step: 1,
			showValue: true
		}
	]);

	let value1 = $state(65);
	let value2 = $state(30);
	let value3 = $state(85);
	let animatedValue = $state(0);

	// Animated meter that cycles through values
	$effect(() => {
		const interval = setInterval(() => {
			if (animatedValue < 100) {
				animatedValue = animatedValue + 5;
			} else {
				animatedValue = 0;
			}
		}, 500);

		return () => clearInterval(interval);
	});
</script>

<DocPage
	title="Meter"
	subtitle="Visualizes a scalar value within a known range."
	component="Meter"
	features={[
		'Spring-animated fill via useSpringState',
		'Stacked values with optional legend',
		'Colored threshold steps on track',
		'Configurable min/max range',
		'Percentage or raw value indicator'
	]}
>
	<ComponentCard
		{controls}
		description="Simple meter with percentage indicator."
		code={`<Meter
	value={${controls.value.value}}
	color="${controls.value.color}"
	size="${controls.value.size}"
	showIndicatorAs={${controls.value.indicator === 'hidden' ? 'undefined' : `'${controls.value.indicator}'`}}
	label="Progress"
	helper="${controls.value.value}% complete"
/>`}
	>
		<Meter
			value={controls.value.value}
			color={controls.value.color}
			size={controls.value.size}
			showIndicatorAs={controls.value.indicator === 'hidden' ? undefined : controls.value.indicator}
			label="Progress"
			helper={`${controls.value.value}% complete`}
		/>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard description="Progress bars in small, normal, and large sizes.">
			<div class="grid w-full gap-6">
				<Meter value={60} size="small" showIndicatorAs={undefined} />
				<Meter value={60} size="normal" showIndicatorAs={undefined} />
				<Meter value={60} size="large" showIndicatorAs={undefined} />
			</div>
		</ComponentCard>

		<ComponentCard description="Simple meter with percentage indicator.">
			<Meter value={value1} label="Progress" helper="65% complete" />
		</ComponentCard>

		<ComponentCard description="Meter showing the raw value instead of a percentage.">
			<Meter
				value={value2}
				showIndicatorAs="value"
				label="Score"
				description="Current score out of 100"
			/>
		</ComponentCard>

		<ComponentCard description="Meter with colored threshold steps on the track.">
			<Meter
				value={value3}
				label="Performance Level"
				helper="Excellent!"
				steps={[
					{ label: 'Poor', start: 0, end: 25, color: 'danger' },
					{ label: 'Fair', start: 25, end: 50, color: 'warning' },
					{ label: 'Good', start: 50, end: 75, color: 'success' },
					{ label: 'Excellent', start: 75, end: 100, color: 'info' }
				]}
			/>
		</ComponentCard>

		<ComponentCard
			description="A plain number renders one segment; its legend label defaults to that number."
		>
			<Meter value={42} color="success" showLegend label="Uptime budget" />
		</ComponentCard>

		<ComponentCard description="Multiple stacked meters in a single track.">
			<Meter
				value={[
					{ value: 40, color: 'info' },
					{ value: 30, color: 'success' },
					{ value: 20, color: 'warning' }
				]}
				label="Resource Usage"
				helper="Total: 90%"
			/>
		</ComponentCard>

		<ComponentCard description="Stacked meters with an icon legend.">
			<Meter
				value={[
					{ value: 19, color: 'info', label: 'System', icon: gearIcon },
					{ value: 6, color: 'danger', label: 'Apps', icon: appWindowIcon },
					{ value: 9, color: 'warning', label: 'Documents', icon: fileTextIcon },
					{
						value: 33,
						color: 'success',
						label: 'Multimedia',
						icon: filmStripIcon,
						position: 'bottom'
					}
				]}
				showLegend={true}
				label="Storage Usage"
				helper="Total: 67%"
			/>
		</ComponentCard>

		<ComponentCard description="Spring-animated meter that cycles through values.">
			<Meter
				value={animatedValue}
				color="info"
				label="Loading Progress"
				helper="Watch it animate!"
				stiffness={0.1}
				damping={0.8}
			/>
		</ComponentCard>

		<ComponentCard description="Compact small-size meter.">
			<Meter size="small" value={45} color="success" label="Storage Used" helper="45GB of 100GB" />
		</ComponentCard>

		<ComponentCard description="Meter with the value indicator hidden.">
			<Meter
				value={75}
				color="warning"
				showIndicatorAs={undefined}
				label="Battery Level"
				description="Indicator text hidden"
			/>
		</ComponentCard>

		<ComponentCard description="Meters in danger, warning, success, and info colors.">
			<div class="grid w-full gap-4">
				<Meter value={60} color="danger" label="Danger" size="small" />
				<Meter value={70} color="warning" label="Warning" size="small" />
				<Meter value={80} color="success" label="Success" size="small" />
				<Meter value={90} color="info" label="Info" size="small" />
			</div>
		</ComponentCard>

		<ComponentCard description="Custom scale from 0 to 1000.">
			<Meter
				value={750}
				min={0}
				max={1000}
				showIndicatorAs="value"
				label="Custom Scale"
				helper="750 points"
			/>
		</ComponentCard>

		<ComponentCard
			description="Complete example with legend, steps, and multiple sizes."
			class="!items-start"
		>
			<div class="grid w-full gap-4">
				<Meter
					size="small"
					showLegend
					value={[
						{ value: 25, color: 'danger', position: 'top' },
						{ value: 35, color: 'success', position: 'top' }
					]}
					label="System Resources"
					helper="CPU & Memory Usage"
					description="Combined usage should stay below 80% Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos."
					steps={[
						{ label: 'Safe', start: 0, end: 60, color: 'success', position: 'bottom' },
						{ label: 'Caution', start: 60, end: 80, color: 'warning', position: 'bottom' },
						{ label: 'Critical', start: 80, end: 100, color: 'danger', position: 'bottom' }
					]}
					stiffness={0.15}
					soft={0.2}
				/>
				<Separator />
				<Meter
					showLegend
					value={[
						{ value: 25, color: 'danger', position: 'top' },
						{ value: 35, color: 'success', position: 'top' }
					]}
					label="System Resources"
					helper="CPU & Memory Usage"
					description="Combined usage should stay below 80 Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.%"
					steps={[
						{ label: 'Safe', start: 0, end: 60, color: 'success', position: 'bottom' },
						{ label: 'Caution', start: 60, end: 80, color: 'warning', position: 'bottom' },
						{ label: 'Critical', start: 80, end: 100, color: 'danger', position: 'bottom' }
					]}
					stiffness={0.15}
					soft={0.2}
				/>
				<Separator />
				<Meter
					showLegend
					size="large"
					value={[
						{ value: 25, color: 'danger', position: 'top' },
						{ value: 35, color: 'success', position: 'top' }
					]}
					label="System Resources"
					helper="CPU & Memory Usage"
					description="Combined usage should stay below 80% Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos."
					steps={[
						{ label: 'Safe', start: 0, end: 60, color: 'success', position: 'bottom' },
						{ label: 'Caution', start: 60, end: 80, color: 'warning', position: 'bottom' },
						{ label: 'Critical', start: 80, end: 100, color: 'danger', position: 'bottom' }
					]}
					stiffness={0.15}
					soft={0.2}
				/>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
