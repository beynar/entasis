export const confirmationDescription = `
The confirmation function displays a modal dialog that asks the user to confirm or cancel an action. It returns a Promise that resolves with an object indicating whether the user confirmed or cancelled.

**Usage:**
\`\`\`typescript
import { confirmation } from 'entasis/confirmation';

const { confirmed, result } = await confirmation({
  title: 'Delete Item',
  description: 'Are you sure you want to delete this item? This action cannot be undone.',
  confirm: 'Delete',
  cancel: 'Cancel',
  onConfirm: async () => {
    // Optional: Async function that runs when user confirms
    await deleteItem();
    return 'Item deleted successfully';
  }
});

if (confirmed) {
  console.log('User confirmed:', result); // result is the return value of onConfirm, or undefined
} else {
  console.log('User cancelled');
}
\`\`\`

**Parameters:**
- \`title\` (string, optional): The title displayed in the confirmation dialog. Defaults to the I18n catalog's \`confirmationTitle\` ("Are you sure?")
- \`description\` (string, optional): The description/message shown in the dialog
- \`confirm\` (string | object, optional): The confirm button text, or an object with \`text\` and Button props. Defaults to \`confirmationConfirm\` ("Confirm")
- \`cancel\` (string | object, optional): The cancel button text, or an object with \`text\` and Button props. Defaults to \`confirmationCancel\` ("Cancel")
- \`anchor\` (HTMLElement, optional): Asks in a small popover beside this element instead of a modal dialog (what \`popconfirm()\` does)
- \`position\` (Popover placement, optional, default \`'top'\`): Where that popover sits against \`anchor\`
- \`onConfirm\` (function, optional): An async function that runs when the user clicks confirm. Its return value is passed as \`result\` in the resolved promise. If it throws or rejects, the loading state ends and the dialog stays open, so the user can retry or cancel; the error still propagates like any event handler error, so handle it inside \`onConfirm\` (for example with a toast)

**Returns:**
A Promise that resolves to:
- \`{ confirmed: true, result: R }\` if the user confirmed (where R is the return type of onConfirm, or void)
- \`{ confirmed: false, result: undefined }\` if the user cancelled, or if the \`<Confirmation />\` serving the request unmounts before an answer (or while a failed \`onConfirm\` has left the question open)

**Notes:**
- The dialog is a modal \`role="alertdialog"\` named by \`title\` and described by \`description\`, and prevents interaction with the rest of the page until the user responds
- If \`onConfirm\` is provided, the confirm button shows a loading state while the function executes
- A press outside the dialog does nothing; Escape (and the Android Back gesture) answers it as Cancel: the promise resolves with \`{ confirmed: false }\` without running \`onConfirm\` or the Cancel button's \`onclick\`. While \`onConfirm\` is running, Escape is ignored like the buttons are. There is no close button, visible or hidden: the two answers are the only controls
- Requests made before any \`<Confirmation />\` is mounted are queued and served by the first one that mounts
- With several mounted, the most recently mounted one serves; when it unmounts the previous one takes over again
- When a \`<Confirmation />\` unmounts, every request the user has not answered resolves as \`{ confirmed: false }\`, so an \`await confirmation()\` never hangs. A request whose \`onConfirm\` is already running (it may be what navigated away) still resolves with \`{ confirmed: true, result }\` when it finishes, or \`{ confirmed: false }\` if it fails

## popconfirm()

Guards a click with a confirmation anchored to the element that was clicked, instead of a modal dialog. It returns a click handler:

\`\`\`svelte
<script lang="ts">
  import { popconfirm } from 'entasis/confirmation';
</script>

<Button
  color="danger"
  onclick={popconfirm((event, anchor) => removeFile(file), {
    title: 'Delete this file?',
    description: 'It goes to the trash for 30 days.',
    confirm: { text: 'Delete', color: 'danger' }
  })}
>
  Delete
</Button>

<!-- No handler: Confirm replays the click, so the link is followed -->
<a href="/logout" onclick={popconfirm({ title: 'Sign out?' })}>Sign out</a>
\`\`\`

- Signatures: \`popconfirm(handler?, options?)\` and \`popconfirm(options)\`. Options are those of \`confirmation()\` except \`onConfirm\` and \`anchor\`; \`position\` places the popover (default \`'top'\`)
- The click's own action (following a link, submitting a form) is held back with \`preventDefault()\`. On Confirm, the handler runs with the original event and the clicked element (\`event.currentTarget\` is \`null\` by then, so use \`anchor\`); a returned promise keeps Confirm loading until it settles. Without a handler, Confirm replays the click on the element, which follows the link or submits the form
- Cancel, Escape, a press outside the popover and focus leaving it drop the action; focus returns to the clicked element. While an async handler runs, the question stays open
- A second click on the element while its question is open does not ask again
- Needs the same mounted \`<Confirmation />\` as \`confirmation()\`
`;
