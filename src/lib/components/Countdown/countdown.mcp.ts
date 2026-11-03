export const countdownDescription = `
# Countdown Component

Countdown shows the time left until a moment, as localized text: "3 days", "3 days, 4 hours", or a compact clock ("2:14:05"). It formats with \`Intl\` in the active I18n locale, so every locale works without catalog strings. Once the moment is reached it reads the localized "now" and calls \`onComplete\` once.

It does not tick every second: one timer is aimed at the next moment the text changes (the next unit boundary), and it resyncs when the page becomes visible again.

## Basic Usage

\`\`\`svelte
<script>
	import { Countdown } from 'entasis/countdown';

	const resumeAt = new Date(Date.now() + 3 * 86_400_000 + 4 * 3_600_000);
</script>

<!-- "3 days" -->
<Countdown until={resumeAt} />

<!-- "3 days, 4 hours" (fr: « 3 jours et 4 heures ») -->
<Countdown until={resumeAt} units={2} />

<!-- "2:14:05" -->
<Countdown until={resumeAt} format="clock" />
\`\`\`

\`until\` (and \`from\`) accept a \`Date\`, an ISO 8601 string, or epoch milliseconds.

## Units

\`units\` counts units from the largest non-zero one: days, hours, minutes, seconds. Units below the last shown one are truncated, zero units are left out (\`units={2}\` with 3 days and 5 minutes left reads "3 days"). The remaining time is rounded up to the second, so the text reaches "now" exactly at \`until\`.

## Inside a Stat

Stat's \`value\` is a Slot, so the countdown takes the Stat's value typography.

\`\`\`svelte
<Stat label="Resumes in">
	{#snippet value()}
		<Countdown until={resumeAt} units={2} />
	{/snippet}
</Stat>
\`\`\`

## Custom Rendering

\`children\` receives the countdown payload. Pass \`from\` to get \`fraction\`, the elapsed share of \`from\` → \`until\`; the component then also wakes every 0.5% of that span so a bar moves smoothly.

\`\`\`svelte
<Countdown until={resumeAt} from={pausedAt} units={2}>
	{#snippet children({ label, fraction, done })}
		<Progress value={(fraction ?? 0) * 100} label={done ? 'Resumed' : \`Resumes in \${label}\`} showValue />
	{/snippet}
</Countdown>
\`\`\`

## Completion

\`\`\`svelte
<Countdown until={resumeAt} onComplete={() => invalidate('app:run')} />
\`\`\`

\`onComplete\` fires once per \`until\` value: when the moment is reached, or on mount when it has already passed. Changing \`until\` re-arms it.

## Props

### Core Props
- **until**: Date | string | number (required) - The moment the countdown reaches.
- **from**: Date | string | number - The moment the countdown started; only feeds \`fraction\`.
- **format**: 'relative' | 'clock' (default: 'relative') - Relative words, or a compact clock with the days in front when there are any ("2d 03:14:05").
- **units**: number (default: 1) - How many units the relative text shows, from the largest non-zero one (1 to 4).
- **locale**: Intl.LocalesArgument - Locale of the text. Defaults to the I18n locale.
- **ref**: HTMLElement | null - Bindable reference to the root \`<time>\`.
- **class**: string - Additional classes for the root.
- **theme**: CountdownThemeProps - Theme overrides.
- Any other HTML attribute lands on the root \`<time>\`.

### Callbacks
- **onComplete**: () => void - Called once when \`until\` is reached.

### Slots
- **children**: Snippet<[CountdownPayload]> - Custom rendering. The payload is \`{ remaining, days, hours, minutes, seconds, label, done, fraction }\`: \`remaining\` in milliseconds, the four parts split the remaining time (rounded up to the second), \`label\` is the default text, \`fraction\` is 0 to 1 or \`null\` without \`from\`.

## Structure

\`\`\`
<time role="timer" datetime="<ISO of until>" data-slot="countdown" data-format data-done>
	label
	<!-- format="clock" -->
	<span data-slot="countdown-clock" aria-hidden="true">2:14:05</span>
	<span data-slot="countdown-spoken" class="sr-only">2 hours, 14 minutes, 5 seconds</span>
</time>
\`\`\`

## Theme Parts

- **root**: The \`<time>\` element; \`format\` variant ('relative' | 'clock'). Tabular digits, no type size of its own, so it inherits the surrounding typography.
- **clock**: The visible clock digits.
- **spoken**: The visually hidden spelled-out clock.

## Accessibility

- The root is a \`<time>\` whose \`datetime\` is the ISO 8601 form of \`until\`.
- \`role="timer"\` carries an implicit \`aria-live="off"\`: screen readers read the current value when they reach it and are not interrupted as it changes.
- The clock format hides its digits from assistive technology and reads every unit in words instead.
- Nothing animates; text changes are instant, so there is nothing to reduce under reduced motion.

## Notes

- The server renders the value at render time; the client re-reads the clock on mount.
- Long waits are safe: timers longer than ~24.8 days wake up early and reschedule.
- An invalid \`until\` renders nothing and never completes.
`;
