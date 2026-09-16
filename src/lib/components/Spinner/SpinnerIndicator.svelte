<script lang="ts">
	import type { SpinnerVariant } from './spinner.props.js';

	let { variant, class: className }: { variant: SpinnerVariant; class?: string } = $props();

	const gridDelays = [0, -80, -160, -80, -160, -240, -160, -240, -320] as const;
	const pulseDelays = [-420, -280, -140] as const;
	const puffDelays = [0, -700] as const;
	const radialSegments = Array.from({ length: 12 }, (_, index) => ({
		angle: `${index * 30}deg`,
		lineDelay: `${(index - 12) * 91.67}ms`,
		circleDelay: `${(index - 12) * 100}ms`
	}));
</script>

<span data-slot="spinner-indicator" data-variant={variant} aria-hidden="true" class={className}>
	{#if variant === 'grid'}
		{#each gridDelays as delay, index (index)}
			<span style:--spinner-delay={`${delay}ms`}></span>
		{/each}
	{:else if variant === 'pulse'}
		{#each pulseDelays as delay, index (index)}
			<span style:--spinner-delay={`${delay}ms`}></span>
		{/each}
	{:else if variant === 'puff'}
		{#each puffDelays as delay, index (index)}
			<span style:--spinner-delay={`${delay}ms`}></span>
		{/each}
	{:else if variant === 'lines' || variant === 'circles'}
		{#each radialSegments as segment, index (index)}
			<span
				style:--spinner-angle={segment.angle}
				style:--spinner-delay={variant === 'lines' ? segment.lineDelay : segment.circleDelay}
			></span>
		{/each}
	{/if}
</span>

<style>
	[data-variant='grid'],
	[data-variant='pulse'],
	[data-variant='puff'],
	[data-variant='lines'],
	[data-variant='circles'] {
		width: var(--spinner-size);
		height: var(--spinner-size);
	}

	[data-variant='default'],
	[data-variant='puff'],
	[data-variant='lines'] {
		scale: 0.916667;
	}

	[data-variant='circles'] {
		scale: 1.061;
	}

	[data-variant='grid'] {
		gap: calc(var(--spinner-size) * 0.08);
	}

	[data-variant='grid'] > span {
		width: 72%;
		aspect-ratio: 1;
		border-radius: 9999px;
		background: currentColor;
		animation: spinner-grid 1.1s ease-in-out infinite;
		animation-delay: var(--spinner-delay);
	}

	[data-variant='pulse'] > span {
		width: calc(var(--spinner-size) * 0.24);
		aspect-ratio: 1;
		border-radius: 9999px;
		background: currentColor;
		animation: spinner-pulse 1s ease-in-out infinite;
		animation-delay: var(--spinner-delay);
	}

	[data-variant='puff'] > span {
		position: absolute;
		inset: 0;
		box-sizing: border-box;
		border: max(1px, calc(var(--spinner-size) * 0.08)) solid currentColor;
		border-radius: 9999px;
		animation: spinner-puff 1.4s cubic-bezier(0.2, 0.65, 0.35, 1) infinite;
		animation-delay: var(--spinner-delay);
	}

	[data-variant='lines'] > span {
		position: absolute;
		top: 0;
		left: calc(50% - var(--spinner-size) * 0.045);
		width: calc(var(--spinner-size) * 0.09);
		height: calc(var(--spinner-size) * 0.3);
		border-radius: 9999px;
		background: currentColor;
		transform: rotate(var(--spinner-angle));
		transform-origin: 50% calc(var(--spinner-size) * 0.5);
		animation: spinner-lines 1.1s linear infinite;
		animation-delay: var(--spinner-delay);
	}

	[data-variant='circles'] > span {
		position: absolute;
		top: 50%;
		left: 50%;
		width: calc(var(--spinner-size) * 0.16);
		aspect-ratio: 1;
		margin: calc(var(--spinner-size) * -0.08);
		transform: rotate(var(--spinner-angle)) translateY(-220%);
	}

	[data-variant='circles'] > span::before {
		content: '';
		display: block;
		width: 100%;
		height: 100%;
		border-radius: 9999px;
		background: currentColor;
		animation: spinner-circles 1.2s ease-in-out infinite;
		animation-delay: var(--spinner-delay);
	}

	@keyframes spinner-grid {
		0%,
		65%,
		100% {
			opacity: 0.28;
			transform: scale(0.55);
		}
		32% {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes spinner-pulse {
		0%,
		70%,
		100% {
			opacity: 0.25;
			transform: scale(0.55);
		}
		35% {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes spinner-puff {
		0% {
			opacity: 1;
			transform: scale(0.2);
		}
		100% {
			opacity: 0;
			transform: scale(1);
		}
	}

	@keyframes spinner-lines {
		0% {
			opacity: 1;
		}
		35%,
		100% {
			opacity: 0.16;
		}
	}

	@keyframes spinner-circles {
		0%,
		62%,
		100% {
			opacity: 0.22;
			transform: scale(0.55);
		}
		31% {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>
