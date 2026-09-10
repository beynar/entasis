export const toastDescription = `
The toast function displays non-blocking notification messages to the user. It provides color-based methods (primary, secondary, success, warning, danger, info, neutral) that each return a Toast instance.


**Usage:**
\`\`\`typescript
import { toast } from 'svelai/toast';

// Basic toast with a color variant
toast.success({
  title: 'Success!',
  description: 'Your changes have been saved.',
  duration: 4000
});

// Toast with custom position
toast.danger({
  title: 'Error',
  description: 'Something went wrong.',
  position: 'top-center',
  duration: 5000
});

// Toast with loading state
toast.info({
  title: 'Processing',
  description: 'Please wait...',
  loading: true,
  duration: false // Don't auto-close
});

// Toast with callbacks
toast.warning({
  title: 'Warning',
  description: 'This action cannot be undone.',
  duration: 6000,
  onAfterOpen: (toast) => console.log('Toast opened:', toast.id),
  onDismiss: (toast) => console.log('Toast dismissed:', toast.id),
  onAutoDismiss: (toast) => console.log('Toast timed out:', toast.id)
});
\`\`\`

**Available Color Methods:**
- \`toast.primary(options)\` - Primary color variant
- \`toast.secondary(options)\` - Secondary color variant
- \`toast.success(options)\` - Success/green variant
- \`toast.warning(options)\` - Warning/yellow variant
- \`toast.danger(options)\` - Danger/red variant
- \`toast.info(options)\` - Info/blue variant
- \`toast.neutral(options)\` - Neutral color variant

**Parameters (all optional):**
- \`title\` (Slot or string): The toast title text
- \`description\` (Slot or string) optional: The toast description/message text
- \`position\` (ToastPosition, optional): Position on screen. Options: \`'top-left'\`, \`'top-right'\`, \`'top-center'\`, \`'bottom-left'\`, \`'bottom-right'\`, \`'bottom-center'\`, plus \`'banner-top'\` / \`'banner-bottom'\` which render a full screen-width bar flush to the top/bottom edge. Default: \`'bottom-right'\`. Swipe axis follows the anchor: left/right corners swipe horizontally, center + banner positions swipe vertically.
- \`duration\` (number | false, optional): Time in milliseconds before auto-closing. Set to \`false\` to disable auto-close. Default: 4000ms
- \`closeOnClick\` (boolean, optional): If true, clicking the toast closes it. Default: inherited from Toaster
- \`showCloseIcon\` (boolean, optional): If true, shows a close button. Default: inherited from Toaster
- \`dismissible\` (boolean, optional): If false, prevents user from dismissing. Default: inherited from Toaster
- \`richColors\` (boolean, optional): If true, uses richer color variants. Default: inherited from Toaster
- \`loading\` (boolean, optional): If true, shows a loading spinner using Theme's global \`spinnerVariant\`
- \`progress\` (boolean, optional): If true, shows a bar counting down the remaining duration (pauses on hover). Only appears when the toast has a finite \`duration\`. Can also be set on \`<Toaster progress />\` as a default.
- \`swipeToDismiss\` (boolean, optional, default true): Drag the toast toward its anchored screen edge (down for bottom-*, up for top-*) past a threshold to dismiss it; dragging the other way rubber-bands. A manual dismiss fires \`onDismiss\`, not \`onAutoDismiss\`.
- \`closeOnClick\` (boolean, optional, default false): Dismiss when the toast body is clicked. Off by default now that swipe-to-dismiss exists; the close icon and swipe are the primary dismiss affordances.
- \`size\` (Sizes, optional): Size of the toast — scales padding, corner radius, type and icon. Options: \`'small'\`, \`'normal'\`, \`'large'\` (default \`'normal'\`). Can be defaulted for all toasts with \`<Toaster size="..." />\`.
- \`prefix\` (Slot | false, optional): Content before the text. \`false\` hides the default icon
- \`suffix\` (Slot, optional): Content to display after the toast text
- \`actions\` (ToastAction[], optional): Buttons rendered inside the toast. \`ToastAction\` is full Button props plus \`content\` (the label) and \`dismiss\` (default true — clicking dismisses the toast). Each button's \`onclick\` runs with the native MouseEvent, then the toast fires \`onDismiss\`.
- \`closeIcon\` (Slot, optional): Custom close button component
- \`icon\` (string, optional): Icon name to display before the toast text
- \`important\` (boolean, optional): Uses \`role="alert"\` + assertive announcements for screen readers
- \`animation\` (FSOProps, optional): Custom animation for this toast
- \`id\` (string, optional): Custom ID for the toast. Auto-generated if not provided
- \`onAfterOpen\` (function, optional): Called once the toast finishes entering: \`(toast: Toast) => void\`
- \`onDismiss\` (function, optional): Called on manual dismiss (close button, an action, or \`toast.remove()\`). Not called on timeout: \`(toast: Toast) => void\`
- \`onAutoDismiss\` (function, optional): Called only when the toast times out after \`duration\`. Put deferred irreversible work here; it never runs if the toast is dismissed first: \`(toast: Toast) => void\`

### Undo / deferred-commit pattern

Remove the item from the UI immediately, defer the real irreversible action to \`onAutoDismiss\`, and offer an \`Undo\` action. Undo dismisses the toast manually, so \`onAutoDismiss\` never fires:

\`\`\`ts
function deleteItem(item) {
  removeFromUI(item);                       // optimistic
  toast.neutral({
    title: \`Deleted "\${item.name}"\`,
    duration: 5000,
    actions: [{ content: 'Undo', onclick: () => restore(item) }],
    onAutoDismiss: () => commitDelete(item)   // runs only if not undone
  });
}
\`\`\`

**Returns:**
A \`Toast\` instance that you can use to programmatically control the root:
- \`toast.remove()\` - Remove the toast manually
- \`toast.id\` - Unique identifier
- \`toast.opts\` - Toast options

**Notes:**
- Toasts are non-blocking and don't prevent user interaction
- Multiple toasts can be displayed simultaneously and will stack based on position
- Toasts pause their auto-close timer when hovered
- Toasts can be dismissed by clicking the close icon, clicking the toast (if \`closeOnClick\` is true), or automatically after the duration expires

## Theme Customization

The Toast component uses a theme object that can be customized using the \`theme\` prop in toast options or by setting a global theme.

### Theme Structure

The theme object contains the following parts:
- **root**: Main toast container styles
- **prefix**: Prefix icon/content styles
- **suffix**: Suffix content styles
- **content**: Content wrapper styles
- **closeIcon**: Close button icon styles
- **title**: Title text styles
- **description**: Description text styles

### Available Variants

**root**:
- base: Base classes for toast container
- Variants:
  - richColors: boolean - Rich color variant styling
  - color: Color variants
  - size: 'small' | 'normal' | 'large' - Toast size

**prefix**:
- base: Base classes for prefix content
- Variants:
  - size: 'small' | 'normal' | 'large' - Icon size
  - color: Color variants
  - richColors: boolean - Rich color variant styling

**suffix**:
- base: Base classes for suffix content
- Variants:
  - size: 'small' | 'normal' | 'large' - Content size
  - color: Color variants
  - richColors: boolean - Rich color variant styling

**content**:
- base: Base classes for content wrapper
- Variants:
  - size: 'small' | 'normal' | 'large' - Content size
  - color: Color variants
  - richColors: boolean - Rich color variant styling

**closeIcon**:
- base: Base classes for close button
- Variants:
  - richColors: boolean - Rich color variant styling
  - color: Color variants

**title**:
- base: Base classes for title text
- Variants:
  - size: 'small' | 'normal' | 'large' - Text size
  - color: Color variants
  - richColors: boolean - Rich color variant styling

**description**:
- base: Base classes for description text
- Variants:
  - size: 'small' | 'normal' | 'large' - Text size
  - color: Color variants
  - richColors: boolean - Rich color variant styling

### Usage Examples

**Basic Theme Override**:
\`\`\`typescript
import { toast } from 'svelai/toast';

toast.success({
  title: 'Success',
  description: 'Operation completed',
  theme: {
    root: {
      base: 'rounded-xl shadow-xl',
      size: {
        normal: 'px-4 py-3'
      }
    }
  }
});
\`\`\`

**Custom Toast Styling**:
\`\`\`typescript
toast.danger({
  title: 'Error',
  description: 'Something went wrong',
  theme: {
    root: {
      base: 'border-2 border-red-500',
      richColors: {
        true: 'bg-red-50 border-red-500'
      }
    },
    title: {
      base: 'font-bold text-red-900'
    }
  }
});
\`\`\`

**Global Theme Setting**:
\`\`\`svelte
<script>
  import { setToastTheme } from 'svelai/toast';
  
  setToastTheme({
    root: {
      base: 'rounded-lg shadow-lg border',
      size: {
        normal: 'px-3 py-2'
      }
    },
    title: {
      base: 'font-semibold'
    }
  });
</script>
\`\`\`
`;
