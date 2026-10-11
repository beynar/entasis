export const typesDescription = `
# Shared theme types

Import from \`entasis/types\`.

Colors names semantic palette roles. Sizes selects small, normal, or large component geometry. Density uses a separate compact/normal/comfortable scale for internal whitespace, so a density value can never be passed where a size is expected. The module also exports theme color paths, typography paths, transition easing, style types, and deepMerge for composing nested theme values.

## Open-change details

Every overlay's \`onOpenChange(open, details)\` receives \`OpenChangeDetails\` as its second argument, and runs before the state changes:

- \`reason\` (\`OpenChangeReason\`): \`'trigger-press'\`, \`'trigger-hover'\`, \`'trigger-focus'\`, \`'outside-press'\`, \`'escape-key'\`, \`'close-watcher'\` (the Android Back gesture), \`'close-press'\`, \`'item-press'\`, \`'list-navigation'\`, \`'focus-out'\`, \`'swipe'\`, \`'trigger-unmount'\` or \`'imperative-action'\`.
- \`event\`: the DOM event behind the change, when there is one.
- \`trigger\`: the trigger element involved, when a trigger caused it.
- \`interaction\` (\`OpenChangeInteraction\`): \`'mouse'\`, \`'touch'\`, \`'pen'\`, \`'keyboard'\` or \`'programmatic'\`.
- \`cancel()\` keeps the overlay as it was and leaves the event untouched (a cancelled Escape is not \`defaultPrevented\`); \`isCanceled\` reports it.

\`OpenChangeHandler\` is the \`(open, details) => void\` signature itself. Inside the callback, \`open\` still holds the previous state.

\`\`\`ts
import type { OpenChangeDetails } from 'entasis/types';

// Keeps an editor open when the user presses outside it with unsaved text.
export function keepDraftOpen(draft: () => string) {
	return (open: boolean, details: OpenChangeDetails) => {
		if (!open && details.reason === 'outside-press' && draft()) details.cancel();
	};
}
\`\`\`
`;
