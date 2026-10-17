<script lang="ts">
	import Button from '../Button/Button.svelte';
	import { arrowRightIcon } from '../Icons/arrowRight.js';
	import { checkIcon } from '../Icons/check.js';
	import {
		useAIAskUserQuestionTheme,
		type AIAskUserQuestionThemeProps
	} from './aiAskUserQuestion.theme.js';

	let {
		isLast,
		canSkip,
		disabled,
		isSubmitting,
		isDiscarding,
		canDiscard,
		nextLabel,
		skipLabel,
		submitLabel,
		submittingLabel,
		discardLabel,
		onPrimary,
		onDiscard,
		theme
	}: {
		isLast: boolean;
		/** The active question is optional and unanswered, so the primary action skips it. */
		canSkip: boolean;
		disabled: boolean;
		isSubmitting: boolean;
		isDiscarding: boolean;
		canDiscard: boolean;
		nextLabel: string;
		skipLabel: string;
		submitLabel: string;
		submittingLabel: string;
		discardLabel: string;
		onPrimary: () => void;
		onDiscard: () => void;
		theme?: AIAskUserQuestionThemeProps;
	} = $props();

	const classes = $derived(useAIAskUserQuestionTheme(theme));
	const skipping = $derived(!isLast && canSkip);
</script>

<!-- The step dots and the primary action navigate; there is no second pair of arrow buttons. -->
<div data-slot="ai-ask-user-question-footer" class={classes.footer()}>
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
		variant={skipping ? 'outline' : undefined}
		color={skipping ? 'neutral' : undefined}
		prefix={isLast ? checkIcon : undefined}
		suffix={isLast ? undefined : arrowRightIcon}
		loading={isLast && isSubmitting}
		{disabled}
		onclick={onPrimary}
	>
		{isLast ? (isSubmitting ? submittingLabel : submitLabel) : skipping ? skipLabel : nextLabel}
	</Button>
</div>
