<script lang="ts">
	import { Annotation } from '$lib/components/Annotation/index.js';
	import type { AnnotationColor, AnnotationPlacement } from '$lib/components/Annotation/index.js';
	import Button from '$lib/components/Button/Button.svelte';
	import Card from '$lib/components/Card/Card.svelte';
	import Chip from '$lib/components/Chip/Chip.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import DocPage from '../../DocPage.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';

	const placements: AnnotationPlacement[] = [
		'top-start',
		'top',
		'top-end',
		'left',
		'right',
		'bottom-start',
		'bottom',
		'bottom-end'
	];
	const colors: AnnotationColor[] = [
		'neutral',
		'primary',
		'secondary',
		'info',
		'success',
		'warning',
		'danger',
		'rainbow'
	];

	const controls = createComponentControls([
		{
			name: 'placement',
			type: 'segmented',
			label: 'Placement',
			value: 'bottom',
			options: placements
		},
		{
			name: 'color',
			type: 'segmented',
			label: 'Color',
			value: 'warning',
			options: colors
		},
		{ name: 'highlight', type: 'switch', label: 'Highlight', value: true },
		{ name: 'draw', type: 'switch', label: 'Draw', value: true }
	]);

	// The drawing plays once, when an annotation comes into view: a new key puts the example in again.
	let replay = $state(0);

	// Only what differs from the defaults is written in the Usage code.
	const usageProps = $derived(
		[
			controls.value.placement !== 'bottom' && ` placement="${controls.value.placement}"`,
			controls.value.color !== 'neutral' && ` color="${controls.value.color}"`,
			!controls.value.highlight && ' highlight={false}',
			controls.value.draw && ' draw'
		]
			.filter(Boolean)
			.join('')
	);
</script>

<svelte:head>
	<!-- The notes' handwriting. The component names it first in its font stack and does not load it. -->
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Shantell+Sans:wght@400;500&display=swap"
	/>
</svelte:head>

<DocPage
	title="Annotation"
	subtitle="A marker tint, a handwritten note and a hand-drawn arrow, to call attention to a piece of content."
	component="Annotation"
	features={[
		'Eight placements, with straight and slanted arrows',
		'Any colour role, or a turning rainbow',
		'A marker alone when there is no note',
		'Can draw itself in when it comes into view',
		'Placed by CSS alone and rendered whole on the server',
		'The note describes its target for assistive technology',
		'Follows the reading direction'
	]}
>
	<ComponentCard
		{controls}
		description="Wrap what you want to point at, and write the note."
		class="mx-auto max-w-3xl"
		code={`<p>
	The dashboard updates
	<Annotation note="no refresh needed"${usageProps}>in real time</Annotation>.
</p>`}
	>
		<p class="py-24 text-center text-lg">
			The dashboard updates
			<Annotation
				note="no refresh needed"
				placement={controls.value.placement as AnnotationPlacement}
				color={controls.value.color as AnnotationColor}
				highlight={controls.value.highlight}
				draw={controls.value.draw}>in real time</Annotation
			>.
		</p>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Placements"
			description="`placement` is where the note sits; the arrow runs from the note to the target. `start` and `end` draw it on a slant."
			class="mx-auto max-w-4xl"
			code={`<Annotation note="top-start" placement="top-start">target</Annotation>
<Annotation note="top" placement="top">target</Annotation>
<Annotation note="top-end" placement="top-end">target</Annotation>
<Annotation note="left" placement="left">target</Annotation>
<Annotation note="right" placement="right">target</Annotation>
<Annotation note="bottom-start" placement="bottom-start">target</Annotation>
<Annotation note="bottom" placement="bottom">target</Annotation>
<Annotation note="bottom-end" placement="bottom-end">target</Annotation>`}
		>
			<div class="grid w-full grid-cols-2 justify-items-center gap-y-32 py-24 md:grid-cols-4">
				{#each placements as placement (placement)}
					<Annotation note={placement} {placement} color="info">target</Annotation>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			title="Drawn in"
			description="With `draw` the annotation is drawn when it comes into view: the marker sweeps over the target, the note is written, then the arrow is traced from the note to the target. It plays once, and not at all under reduced motion. `drawOffset` is how far up the screen it must be first. `--annotation-draw-duration` and `--annotation-draw-delay` set its pace, so several can follow one another."
			class="mx-auto max-w-4xl"
			code={`<Annotation draw note="no refresh needed" color="warning">in real time</Annotation>

<!-- One after the other -->
<Annotation draw note="first" placement="top" color="info">this</Annotation>
<Annotation draw note="then" color="success" class="[--annotation-draw-delay:900ms]">
	that
</Annotation>

<!-- Slower -->
<Annotation draw note="take your time" class="[--annotation-draw-duration:2.4s]">slowly</Annotation>

<!-- Once it is a quarter of the way up the screen -->
<Annotation draw drawOffset="25%" note="look">here</Annotation>

<!-- It plays once: a new key plays it again -->
{#key replay}
	<Annotation draw note="again">target</Annotation>
{/key}`}
		>
			<div class="flex w-full flex-col items-center gap-20 py-16">
				{#key replay}
					<p class="text-center text-lg">
						Start with
						<Annotation draw note="first" placement="top" color="info">this</Annotation>, go on with
						<Annotation draw note="then" color="success" class="[--annotation-draw-delay:900ms]">
							that
						</Annotation>, and finish
						<Annotation
							draw
							note="take your time"
							placement="right"
							color="warning"
							class="[--annotation-draw-delay:1800ms] [--annotation-draw-duration:2.4s]"
						>
							slowly
						</Annotation>
					</p>
				{/key}
				<Button variant="outline" onclick={() => replay++}>Play again</Button>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Colours"
			description="One colour for the marker, the arrow and the note: a role, or `rainbow`, a hue that keeps turning and holds still under reduced motion."
			class="mx-auto max-w-4xl"
			code={`<Annotation note="primary" color="primary">target</Annotation>
<Annotation note="success" color="success">target</Annotation>
<Annotation note="rainbow" color="rainbow">target</Annotation>`}
		>
			<div class="grid w-full grid-cols-2 justify-items-center gap-y-24 pt-4 pb-20 md:grid-cols-4">
				{#each colors as color (color)}
					<Annotation note={color} {color}>target</Annotation>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			title="A marker alone"
			description="Without a note there is no arrow: the target is tinted, as with a marker pen."
			class="mx-auto max-w-3xl"
			code={`<p>
	Ship the <Annotation color="warning">first version</Annotation> this week, then
	<Annotation color="success">measure</Annotation> before adding anything.
</p>`}
		>
			<p class="max-w-md text-lg">
				Ship the <Annotation color="warning">first version</Annotation> this week, then
				<Annotation color="success">measure</Annotation> before adding anything.
			</p>
		</ComponentCard>

		<ComponentCard
			title="Round a control or a block"
			description="Turn `highlight` off for a target that has its own fill. `as=&quot;div&quot;` goes round a block."
			class="mx-auto max-w-4xl"
			code={`<Annotation note="start here" placement="right" highlight={false} color="primary">
	<Button color="primary">Create project</Button>
</Annotation>

<Annotation note="still in beta" placement="top-end" highlight={false} color="secondary">
	<Chip>Insights</Chip>
</Annotation>

<Annotation as="div" note="updated every hour" placement="bottom-start" highlight={false}>
	<Card>...</Card>
</Annotation>`}
		>
			<div class="flex w-full flex-col items-center gap-28 py-16">
				<div class="flex w-full flex-wrap items-center justify-evenly gap-y-24">
					<Annotation note="start here" placement="right" highlight={false} color="primary">
						<Button color="primary">Create project</Button>
					</Annotation>
					<Annotation note="still in beta" placement="top-end" highlight={false} color="secondary">
						<Chip>Insights</Chip>
					</Annotation>
				</div>
				<Annotation
					as="div"
					note="updated every hour"
					placement="bottom-start"
					highlight={false}
					color="success"
					class="w-64"
				>
					<Card>
						<p class="text-neutral-readable text-sm">Revenue</p>
						<p class="text-2xl font-semibold">€48,200</p>
					</Card>
				</Annotation>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Two notes on one target"
			description="Annotations nest: wrap one in another to point at the same target from two sides. Keep the tint on one of them."
			class="mx-auto max-w-3xl"
			code={`<Annotation note="fast" placement="top" color="info" highlight={false}>
	<Annotation note="and cheap" placement="bottom" color="success">this plan</Annotation>
</Annotation>`}
		>
			<p class="py-24 text-center text-lg">
				Most teams pick
				<Annotation note="fast" placement="top" color="info" highlight={false}>
					<Annotation note="and cheap" placement="bottom" color="success">this plan</Annotation>
				</Annotation>
				first.
			</p>
		</ComponentCard>

		<ComponentCard
			title="Fine tuning"
			description="Variables on the root move and restyle the drawing: any colour, a straight note, a wider one, a larger hand."
			class="mx-auto max-w-4xl"
			code={`<Annotation note="any colour" class="[--annotation-color:#ff1493]">hot pink</Annotation>

<Annotation note="a straight note" class="[--annotation-rotate:0deg]">level</Annotation>

<Annotation
	note="a longer note that needs more room to say it all"
	class="[--annotation-label-max-width:240px]"
>
	wide
</Annotation>

<Annotation note="louder" class="[--annotation-font-size:1.4rem]">big</Annotation>`}
		>
			<div class="grid w-full grid-cols-2 justify-items-center gap-y-24 pt-4 pb-24 md:grid-cols-4">
				<Annotation note="any colour" class="[--annotation-color:#ff1493]">hot pink</Annotation>
				<Annotation note="a straight note" class="[--annotation-rotate:0deg]">level</Annotation>
				<Annotation
					note="a longer note that needs more room to say it all"
					class="[--annotation-label-max-width:240px]"
				>
					wide
				</Annotation>
				<Annotation note="louder" class="[--annotation-font-size:1.4rem]">big</Annotation>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
