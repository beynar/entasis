export const aiComposerDescription = `
# AIComposer

AIComposer is a Markdown prompt composer built on the existing \`RichTextInput\`, \`VoiceInput\`, file-acceptance helpers, \`SortableList\`, \`ScrollArea\`, and \`AIFilePreview\`. It adds AI command, mention, reference, and skill tokens; optional voice capture; raw or managed files; queue editing; steering; submit/stop state; and optional \`AIConversation\` integration without owning transport.

## Requires

AIComposer embeds RichTextInput, which is built on Lexical. Those packages are optional peer dependencies of svelai, so install them alongside it:

\`pnpm add lexical @lexical/history @lexical/link @lexical/list @lexical/markdown @lexical/rich-text @lexical/selection @lexical/utils\`

## Import

\`\`\`svelte
<script lang="ts">
  import {
    AIComposer,
    type AIComposerAttachment,
    type AIComposerCommand,
    type AIComposerHandle,
    type AIComposerMentionItem,
    type AIComposerQueuedMessage,
    type AIComposerSkillItem,
    type AIComposerSubmitPayload
  } from 'svelai/ai-composer';
</script>
\`\`\`

## State and defaults

- \`value\`, \`files\`, \`attachments\`, and \`queue\` are bindable.
- Omitted \`value\`, \`files\`, \`attachments\`, \`busy\`, and labels inherit from the nearest \`AIConversation\`. A supplied direct prop always wins.
- \`defaultValue\` initializes an uncontrolled draft once; \`onValueChange\` reports each library edit once and stays silent for parent updates.
- Provider queue synchronization is signature-based and idempotent. It never compares proxy queue objects to their raw counterparts.

## Submission

\`onSubmit\` receives \`AIComposerSubmitPayload\`: display \`markdown\`, model-ready \`modelInput\`, raw files, attachment records, normalized tokens, and command/file/mention/reference/skill id lists. Every submitted token has serialized MDX-style \`markdown\`.

\`\`\`svelte
<AIComposer
  commands={[
    {
      id: 'summarize',
      label: 'Summarize',
      prompt: 'Summarize the request and preserve decisions and risks.'
    }
  ]}
  onSubmit={({ markdown, modelInput, tokens, files }) =>
    sendPrompt({ markdown, modelInput, tokens, files })}
/>
\`\`\`

When no direct submit callback is supplied, the nearest conversation receives a user message and the draft clears after successful submission. Direct callbacks retain the draft so application code controls when it clears. Callback failures render a danger alert. \`onStop\` overrides \`conversation.requestStop()\`; stop failures are also visible.

## Trigger sources

- \`commands\` drives \`/\`; it accepts a Svelte Pro-compatible command array or a trigger-source object.
- \`mentionItems\` is the compatibility list for files, references, and skills.
- \`mentions\` and \`references\` compose into \`@\`; \`skills\` drives \`$\`.
- Trigger-source objects support items, title, empty copy, grouping, token-kind resolution, custom token conversion, sync/async search, and selection.
- Compatibility callbacks are \`onCommandSearch\`, \`onMentionSearch\`, and \`onSkillSearch\`. Mention search receives \`{ query, type }\`; skill search falls back to \`onMentionSearch({ query, type: 'skill' })\`.
- Synchronous searches stay synchronous. Promise searches expose loading/error/request state through the reused RichTextInput lifecycle and ignore stale responses.
- A trigger source's \`onSelect({ item, context })\` is the pick event. The per-kind
  \`onCommandInsert\`, \`onMentionInsert\`, and \`onSkillInsert\` callbacks run after the token is
  inserted, so they are named for the insertion rather than the pick: \`onSelect\` is reserved for
  "the user picked this item" and one component cannot own three of them.
- Those callbacks and \`onSuggestionOpen\`, \`onSuggestionClose\`, \`onSuggestionQueryChange\`, and \`onSuggestionHighlightChange\` receive normalized source/lifecycle data.

## Files and attachments

Set \`fileDropzone\` to enable the chooser, paste, and drag-and-drop intake. The composer delegates to the shared \`FileDropzone\`, exposes \`data-file-drag-state="potential | valid | invalid"\`, and renders a default overlay while a file drag is active. Override its copy with \`dropLabel\` and \`dropInvalidLabel\`, or replace the overlay content through the \`dropzone\` slot, which receives \`{ state, files, accept, multiple, maxFiles, maxFileSize }\`. \`fileMultiple\`, accepted types, maximum count, and maximum bytes use the shared file acceptance rules and report detailed rejections through \`onFileReject\`.

With only \`files\`, the composer uses raw \`File[]\`. Supplying \`attachments\`, an attachment callback, or conversation attachment state activates managed attachments. Managed records use \`pending | uploading | uploaded | failed\`, keep stable ids across queue edits, show \`previewUrl\` or \`remoteUrl\`, and expose add/retry/remove callbacks. Rejected files and retry failures remain visible.

## Voice input

Set \`voiceInput\` to render the existing VoiceInput primitive before the submit control. \`voiceInputVariant\` is \`compact | expandable\` and defaults to \`compact\`. The expandable presentation grows into the remaining footer width while recording; compact remains a mic-sized control.

Configure capture with \`voiceInputMinDuration\`, \`voiceInputMaxDuration\`, \`voiceInputColor\`, the accessible labels, and \`voiceInputTheme\`.

\`onVoiceInput\` is the only voice lifecycle callback. It receives the finalized recording as an \`ArrayBuffer\` and must return a promise. AIComposer clears the internal recording before playback can render and replaces the voice control with a spinner until the promise settles. Callback failures render on the voice field. AIComposer remains transport-free: the callback owns transcription, upload, or any other application workflow. Replacing the complete \`footer\` also replaces the integrated voice control.

\`\`\`svelte
<AIComposer
  voiceInput
  voiceInputVariant="expandable"
  onVoiceInput={(audioBuffer) => transcribe(audioBuffer)}
/>
\`\`\`

## Queue

When \`busy\` and \`queueWhileBusy\` are true, submission creates a flat \`AIComposerQueuedMessage\` and clears the draft. Queue rows can be reordered, steered, edited, restored, cancelled, or have editing cancelled. The lifecycle callbacks are:

- \`onQueueChange\`
- \`onQueuedMessageAdd\`, \`onQueuedMessageCancel\`
- \`onQueuedMessageEditStart\`, \`onQueuedMessageEditCommit\`, \`onQueuedMessageEditCancel\`
- \`onQueuedMessageReorder\`, \`onSteer\`

Single-message queue callbacks receive \`{ message, index }\`; edit commits also include \`previousMessage\`.

AIComposer does not automatically drain the queue when \`busy\` becomes false. Missing queue targets throw instead of reporting a false success.

## Editor and composition

\`submitShortcut\` is \`none | enter | shift-enter | command-enter\`. \`toolbar\` is \`hover | fixed | both | none\`; \`formats\` and \`autoresize\` are forwarded to RichTextInput.

\`header\`, \`prefix\`, \`suffix\`, and \`modelSelector\` are content slots. \`dropzone\` customizes the active file-drop overlay. \`footerStart\`, \`actions\`, and replacement \`footer\` receive \`{ value, files, attachments, isEmpty, isBusy }\`. The default footer orders file/model controls at the start and custom actions, voice input, and submit/stop at the end.

The component handle exposes \`focus\`, \`clear\`, \`insertText\`, \`insertItem\`, \`insertToken\`, \`insertCommand\`, \`insertMention\`, \`insertReference\`, and \`insertSkill\`. \`clear()\` clears editor Markdown and token metadata, not attached files.

The root accepts native form attributes plus bindable \`ref\`, \`class\`, and \`theme\`. Theme parts cover root, dropzone/dropzone icon, header, files, file rows, body, editor, toolbar, errors, footer/actions, the voice-input region, and every queue region. \`voiceInputTheme\` is forwarded to the reused VoiceInput primitive.
`;
