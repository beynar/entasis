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
- \`title\` (string, required): The title displayed in the confirmation dialog
- \`description\` (string, required): The description/message shown in the dialog
- \`confirm\` (string | object, required): The confirm button text, or an object with \`text\` and Button props
- \`cancel\` (string | object, required): The cancel button text, or an object with \`text\` and Button props
- \`onConfirm\` (function, optional): An async function that runs when the user clicks confirm. Its return value is passed as \`result\` in the resolved promise

**Returns:**
A Promise that resolves to:
- \`{ confirmed: true, result: R }\` if the user confirmed (where R is the return type of onConfirm, or void)
- \`{ confirmed: false, result: undefined }\` if the user cancelled

**Notes:**
- The dialog is modal and prevents interaction with the rest of the page until the user responds
- If \`onConfirm\` is provided, the confirm button shows a loading state while the function executes
- The dialog cannot be closed by clicking outside or pressing Escape (user must click a button)
- Requests made before any \`<Confirmation />\` is mounted are queued and served by the first one that mounts
- With several mounted, the most recently mounted one serves; when it unmounts the previous one takes over again
`;
