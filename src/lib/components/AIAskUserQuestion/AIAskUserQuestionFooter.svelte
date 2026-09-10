<script lang="ts">
	import Button from '../Button/Button.svelte';
	import { arrowLeftIcon } from '../Icons/arrowLeft.js';
	import { arrowRightIcon } from '../Icons/arrowRight.js';
	import { checkIcon } from '../Icons/check.js';
	import {
		useAIAskUserQuestionTheme,
		type AIAskUserQuestionThemeProps
	} from './aiAskUserQuestion.theme.js';

	let {
		isFirst,
		isLast,
		disabled,
		isSubmitting,
		isDiscarding,
		canDiscard,
		previousLabel,
		nextLabel,
		submitLabel,
		submittingLabel,
		discardLabel,
		onPrevious,
		onNext,
		onPrimary,
		onDiscard,
		theme
	}: {
		isFirst: boolean;
		isLast: boolean;
		disabled: boolean;
		isSubmitting: boolean;
		isDiscarding: boolean;
		canDiscard: boolean;
		previousLabel: string;
		nextLabel: string;
		submitLabel: string;
		submittingLabel: string;
		discardLabel: string;
		onPrevious: () => void;
		onNext: () => void;
		onPrimary: () => void;
		onDiscard: () => void;
		theme?: AIAskUserQuestionThemeProps;
	} = $props();

	const classes = $derived(useAIAskUserQuestionTheme(theme));
</script>

<div data-slot="ai-ask-user-question-footer" class={classes.footer()}>
	<div class="flex items-center gap-1">
		<Button
			type="button"
			squared
			variant="outline"
			size="small"
			label={previousLabel}
			disabled={disabled || isFirst}
			onclick={onPrevious}
		>
			{@render arrowLeftIcon({ size: 16 })}
		</Button>
		<Button
			type="button"
			squared
			variant="outline"
			size="small"
			label={nextLabel}
			disabled={disabled || isLast}
			onclick={onNext}
		>
			{@render arrowRightIcon({ size: 16 })}
		</Button>
	</div>
	<div class="flex min-w-0 items-center gap-2">
		{#if canDiscard}
			<Button
				type="button"
				variant="ghost"
				color="neutral"
				size="small"
				loading={isDiscarding}
				{disabled}
				onclick={onDiscard}
			>
				{discardLabel}
			</Button>
		{/if}
		<Button
			type="button"
			size="small"
			prefix={isLast ? checkIcon : undefined}
			suffix={isLast ? undefined : arrowRightIcon}
			loading={isLast && isSubmitting}
			{disabled}
			onclick={onPrimary}
		>
			{isLast ? (isSubmitting ? submittingLabel : submitLabel) : nextLabel}
		</Button>
	</div>
</div>
