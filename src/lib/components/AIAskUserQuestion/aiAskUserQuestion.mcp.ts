export const aiAskUserQuestionDescription = `
# AIAskUserQuestion

AIAskUserQuestion renders a validated stepped answer flow for AI tools that need structured human input. It reuses \`Stepper\`, \`TextArea\`, card radio/checkbox inputs, \`FileInput\`, \`Button\`, \`Alert\`, and \`Empty\`.

## Import and schemas

\`\`\`svelte
<script lang="ts">
  import {
    AIAskUserQuestion,
    aiAskUserQuestionToolInputSchema,
    type AIAskUserQuestionQuestion,
    type AIAskUserQuestionSubmitPayload,
    type AIAskUserQuestionValues
  } from 'entasis/ai-ask-user-question';
</script>
\`\`\`

The package exports Valibot schemas for tool state, options, every question kind, question arrays, answer maps, and the complete tool payload. The loose tool payload accepts \`state\`, \`prompt\`, \`questions\`, \`value\`/\`values\`, headings, context, and action labels.

## Question kinds

- Text: \`{ id, title, type?: 'text', description?, required?, placeholder?, rows? }\`
- Single choice: \`{ id, title, type: 'single', options, showOther?, otherLabel?, otherPlaceholder?, ... }\`
- Multiple choice: \`{ id, title, type: 'multiple', options, showOther?, otherLabel?, otherPlaceholder?, ... }\`
- File: \`{ id, title, type: 'file', accept?, multiple?, maxFiles?, maxSize?, ... }\`

Questions are optional by default; \`required: true\` blocks continuing until answered and shows a required marker after the title. On an optional, unanswered step before the last one the primary action reads "Skip" (\`skipLabel\`). Every single- and multiple-choice question offers a free-text "Other…" choice after its options, so the user can always answer in their own words. The component's \`showOther\` prop (default \`true\`) sets this for every choice question and a question's own \`showOther\` wins over it, either way; file questions never get one (their answer is files). In AIThread and AIChat, an \`showOther\` key on the ask_user_question tool input (or the docked request) passes through. The Other… choice: its typed text is the answer (the single answer string, or the last entry of the multiple answer array) and it never auto-advances, even when the text equals an option id. The answer stays a plain string, so in \`summarizeAIAskAnswers\` and in a value restored later, text equal to an option id reads as that option. Disabled choice options remain visible but cannot be selected. File questions use the shared chooser/drop acceptance behavior and show type, size, count, and duplicate failures.

## State and behavior

- \`value\` is the bindable answer map. \`defaultValue\` initializes omitted state once; later default changes do not reset answers.
- \`onValueChange(value)\` runs once after a user changes an answer. Parent value changes and selecting the current answer do not emit it.
- \`activeIndex\` is bindable and is clamped whenever the question list changes.
- \`autoAdvance\` wins over \`autoAdvanceSingle\`; \`autoAdvanceDelay\` wins over \`autoAdvanceSingleDelay\`.
- Single-choice answers auto-advance by default after 280 ms, including values set through a custom question slot. Empty values, anything typed or chosen through "Other…", the last step, disabled state, and active async work never auto-advance.
- Keyboard: number keys 1–9 pick (single) or toggle (multiple) the active question's options, with "Other…" last; digits typed into a text field stay text. When focus is on the question's options, the picked option takes focus and the Tab stop, as an arrow key does in a radio group (picking "Other…" focuses its text field). Enter on a choice or a one-line field continues or submits; in a textarea, Ctrl/Cmd+Enter does. When the step changes with focus inside it, focus moves to the new step's first control (or to the step itself when it has none, such as a file step, where Enter also continues or submits), so the keys keep working step after step. A consumer \`onkeydown\` runs first and \`preventDefault()\` cancels these keys.
- \`disabled\` blocks all controls. \`submitting\` combines with internal async submit/discard state.

## Validation and actions

The default required message is \`Answer required.\`. \`requiredMessage\` accepts either a string or a per-question formatter. It renders once, in the danger colour, under the question; the options themselves stay neutral and the choice group gets \`aria-invalid\` and \`aria-describedby\`. Primary navigation validates the active question; final submission finds the first missing required answer and moves to it. The step dots (8px dots inside 24px pointer targets, labelled "Go to question N") and the primary action navigate; a single question shows no pager. \`previousLabel\` is deprecated: the default footer no longer renders previous/next arrow buttons.

\`onSubmit\` receives typed \`answers\`, the raw \`values\` map, and the source \`questions\`. \`onDiscard\` adds the optional dismiss action. Async submit/discard exceptions and file rejection messages render visibly instead of being swallowed.

\`\`\`svelte
<AIAskUserQuestion
  questions={[
    {
      id: 'tone',
      type: 'single',
      title: 'Choose a tone',
      options: [
        { id: 'brief', label: 'Brief' },
        { id: 'detailed', label: 'Detailed' }
      ]
    },
    {
      id: 'notes',
      type: 'text',
      title: 'Add constraints'
    }
  ]}
  bind:value={answers}
  onSubmit={({ answers, values }) => resolveTool({ answers, values })}
/>
\`\`\`

## Header

The header shows the \`requester\` ("Asked by …") above a semibold \`title\` (default "Answer request") and the optional \`context\`.

## Answered summary

Once a request is complete, keep a compact record in the transcript instead of a raw tool row. \`AIAskUserQuestionSummary\` renders question → chosen labels (option ids become labels, "Other…" and text answers show as typed, files by name, skipped questions read "Skipped"); \`summarizeAIAskAnswers(questions, values)\` returns the same pairs as data.

\`\`\`svelte
<script lang="ts">
  import { AIAskUserQuestionSummary } from 'entasis/ai-ask-user-question';
</script>

<AIAskUserQuestionSummary {questions} value={submittedValues} />
\`\`\`

Props: \`questions\`, \`value\`, \`title\` (string, or \`false\` to hide the "Your answers" heading), \`showSkipped\` (default true), \`ref\`, \`class\`, \`theme\` (summary, summaryTitle, summaryList, summaryItem, summaryQuestion, summaryAnswer).

## Composition

\`header\`, \`footer\`, \`children\`, and \`empty\` receive \`AIAskUserQuestionState\`: questions, value, active question/index, visible error, working flags, first/last flags, and \`goTo\`, \`previous\`, \`next\`, \`submit\`, and \`discard\` actions.

The \`question\` slot receives \`{ question, value, setValue }\`. Its setter preserves central validation, change callbacks, and single-choice auto-advance; no public compound subcomponents are required.

The root forwards native div attributes and exposes bindable \`ref\`, \`class\`, and \`theme\`. Theme parts cover root, header text/requester/progress group/steps, the body region, step content, question title, required marker and description, textarea, option/other/file regions, the per-question error, the submit-failure alert, empty state, footer, and the summary parts.
`;
