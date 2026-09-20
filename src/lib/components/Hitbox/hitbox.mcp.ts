export const hitboxDescription = `
# Hitbox Component

Hitbox enlarges the pointer target of an existing interactive element without changing its visible dimensions or semantics. It renders one transparent, aria-hidden span centered over its positioned parent; pointer events bubble to the parent button or link.

## Usage

\`\`\`svelte
<script>
  import { Hitbox } from 'entasis/hitbox';
</script>

<button type="button" aria-label="Select page" class="relative size-2 rounded-full bg-primary">
  <Hitbox size="normal" />
</button>
\`\`\`

The interactive parent must establish a positioning context and allow overflow. Adjacent controls should reserve enough layout space for their hitboxes so targets do not overlap.

## Props

- **size**: 'small' | 'normal' | 'large' (default: 'normal') - Target dimensions: 20px, 24px, or 28px.
- **ref**: HTMLSpanElement | null - Bindable reference to the transparent span.
- **class**: string - Classes applied to the span.
- **theme**: HitboxThemeProps - Theme overrides for the root part.

## Accessibility

Hitbox is aria-hidden and does not create another focusable element. The parent remains responsible for its accessible name, keyboard behavior, disabled state, and focus indication.

## Theme

- **root**: Transparent centered target surface and size variants.
`;
