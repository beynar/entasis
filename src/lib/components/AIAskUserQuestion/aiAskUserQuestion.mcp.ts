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
- Single choice: \`{ id, title, type: 'single', options, ... }\`
- Multiple choice: \`{ id, title, type: 'multiple', options, ... }\`
- File: \`{ id, title, type: 'file', accept?, multiple?, maxFiles?, maxSize?, ... }\`

Questions are required by default. Disabled choice options remain visible but cannot be selected. File questions use the shared chooser/drop acceptance behavior and show type, size, count, and duplicate failures.

## State and behavior

- \`value\` is the bindable answer map. \`defaultValue\` initializes omitted state once; later default changes do not reset answers.
- \`onValueChange(value)\` runs once after a user changes an answer. Parent value changes and selecting the current answer do not emit it.
- \`activeIndex\` is bindable and is clamped whenever the question list changes.
- \`autoAdvance\` wins over \`autoAdvanceSingle\`; \`autoAdvanceDelay\` wins over \`autoAdvanceSingleDelay\`.
- Single-choice answers auto-advance by default after 280 ms, including values set through a custom question slot. Empty values, the last step, disabled state, and active async work never auto-advance.
- \`disabled\` blocks all controls. \`submitting\` combines with internal async submit/discard state.

## Validation and actions

The default required message is \`Answer required.\`. \`requiredMessage\` accepts either a string or a per-question formatter. Primary navigation validates the active question; final submission finds the first missing required answer and moves to it. Previous/next icon controls remain available for explicit navigation.

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
      title: 'Add constraints',
      required: false
    }
  ]}
  bind:value={answers}
  onSubmit={({ answers, values }) => resolveTool({ answers, values })}
/>
\`\`\`

## Composition

\`header\`, \`footer\`, \`children\`, and \`empty\` receive \`AIAskUserQuestionState\`: questions, value, active question/index, visible error, working flags, first/last flags, and \`goTo\`, \`previous\`, \`next\`, \`submit\`, and \`discard\` actions.

The \`question\` slot receives \`{ question, value, setValue }\`. Its setter preserves central validation, change callbacks, and single-choice auto-advance; no public compound subcomponents are required.

The root forwards native div attributes and exposes bindable \`ref\`, \`class\`, and \`theme\`. Theme parts cover root, header text/progress group/steps, the body region, step content, question title and description, textarea, option/file regions, empty/error states, and footer.
`;
