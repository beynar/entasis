export const avatarDescription = `
# Avatar Component

The Avatar component displays a user's profile picture with fallback initials. It supports a bindable loading flag, various sizes, and badges (prefix/suffix). The AvatarGroup component displays multiple avatars with overlap.

## Basic Usage

\`\`\`svelte
<Avatar name="John Doe" src="https://example.com/avatar.png" />
\`\`\`

## Props

### Core Props
- **name**: string (required) - Display name; its initials are the fallback when no image renders
- **src**: string - Image URL; omit it, or let it fail, to render the initials instead
- **alt**: string - Alternative text for the image (defaults to \`name\`)
- **size**: 'small' | 'normal' | 'large' (default: 'normal')
  - small: 24px (1.5rem)
  - normal: 32px (2rem)
  - large: 40px (2.5rem)

### Loading Props
- **delay**: number (default: 0) - Delay in milliseconds before showing avatar
- **loading**: boolean (default: false, bindable) - True while the image request is in flight; false with no \`src\`, and false once the image has loaded or failed. A failed image is reported by rendering the initials.

### Content Slots
- **prefix**: Slot - Badge/icon positioned at bottom-left
- **suffix**: Slot - Badge/icon positioned at bottom-right

### Styling Props
- **class**: string - Additional CSS classes
- **theme**: ComponentTheme - Custom theme overrides

## Avatar Structure

\`\`\`
<Avatar>
	<AvatarImage />        <!-- Profile picture -->
	<AvatarPrefix />       <!-- Behind the image (bottom-left) -->
	<AvatarSuffix />       <!-- Absolute position (bottom-right) -->
	<AvatarInitials />     <!-- Fallback initials -->
</Avatar>
\`\`\`

## AvatarGroup Props

### Core Props
- **items**: Array<{ src?: string; alt?: string; name: string } & T> (required) - Avatar items
- **max**: number - Maximum number of avatars to show before "+N" indicator
- **size**: 'small' | 'normal' | 'large' (default: 'normal')

### Content Slots
- **avatar**: Snippet<{ item: T; index: number; avatarProps }> - Custom avatar rendering
- **remainingCount**: Snippet<{ items: T[]; remaining: number }> - Custom "+N" counter rendering

### Styling Props
- **class**: string - Additional CSS classes
- **theme**: ComponentTheme - Custom theme overrides

## AvatarGroup Structure

\`\`\`
<AvatarGroup>
	<Avatar />
	<Avatar />
	<Avatar />
	<AvatarGroupCount />   <!-- "+N" indicator -->
</AvatarGroup>
\`\`\`

## Examples

### Basic Avatar
\`\`\`svelte
<Avatar name="Jane Smith" src="/images/jane.jpg" />
\`\`\`

### Without Image (Initials)
\`\`\`svelte
<Avatar name="John Doe" />
<!-- Displays "JD" -->
\`\`\`

### Different Sizes
\`\`\`svelte
<Avatar size="small" name="Small User" />
<Avatar size="normal" name="Normal User" />
<Avatar size="large" name="Large User" />
\`\`\`

### With Status Badge (Prefix)
\`\`\`svelte
<Avatar name="John Doe">
	{#snippet prefix()}
		<div class="w-2 h-2 rounded-full bg-success"></div>
	{/snippet}
</Avatar>
\`\`\`

### With Icon Badge (Suffix)
\`\`\`svelte
<script lang="ts">
	import { Avatar } from 'svelai/avatar';
	import { checkIcon } from 'svelai/icons/check';
</script>

<Avatar name="Jane Smith">
	{#snippet suffix()}
		{@render checkIcon({ class: 'text-success' })}
	{/snippet}
</Avatar>
\`\`\`

### With Loading State
\`\`\`svelte
<script lang="ts">
	let loading = $state(false);
</script>

<Avatar name="John Doe" src="/avatar.jpg" bind:loading />
{loading}
\`\`\`

### Avatar Group
\`\`\`svelte
<script>
	let items = [
		{ name: 'John Doe', src: '/john.jpg' },
		{ name: 'Jane Smith', src: '/jane.jpg' },
		{ name: 'Bob Johnson', src: '/bob.jpg' }
	];
</script>

<AvatarGroup {items} />
\`\`\`

### Avatar Group with Max Limit
\`\`\`svelte
<AvatarGroup 
	items={[
		{ name: 'User 1' },
		{ name: 'User 2' },
		{ name: 'User 3' },
		{ name: 'User 4' },
		{ name: 'User 5' }
	]}
	max={3}
/>
<!-- Shows 3 avatars + "+2" indicator -->
\`\`\`

### Custom Avatar in Group
\`\`\`svelte
<script lang="ts">
	import { Avatar, AvatarGroup } from 'svelai/avatar';

	let items = [{ name: 'John Doe' }, { name: 'Jane Smith' }];
</script>

<AvatarGroup {items}>
	{#snippet avatar({ item, index, avatarProps })}
		<Avatar {...avatarProps} {...item}>
			{#snippet suffix()}
				<span class="text-xs">{index + 1}</span>
			{/snippet}
		</Avatar>
	{/snippet}
</AvatarGroup>
\`\`\`

### Custom Remaining Count
\`\`\`svelte
<script lang="ts">
	import { AvatarGroup } from 'svelai/avatar';

	let items = [{ name: 'User 1' }, { name: 'User 2' }, { name: 'User 3' }, { name: 'User 4' }];
</script>

<AvatarGroup {items} max={3}>
	{#snippet remainingCount({ remaining })}
		<div class="avatar-count">
			+{remaining} more
		</div>
	{/snippet}
</AvatarGroup>
\`\`\`

### Status Indicators
\`\`\`svelte
<Avatar name="Online User">
	{#snippet suffix()}
		<div class="w-3 h-3 rounded-full bg-success border-2 border-surface"></div>
	{/snippet}
</Avatar>

<Avatar name="Away User">
	{#snippet suffix()}
		<div class="w-3 h-3 rounded-full bg-warning border-2 border-surface"></div>
	{/snippet}
</Avatar>
\`\`\`

## Accessibility

- \`alt\` defaults to \`name\`, so the image always carries alt text
- Fallback to initials when image fails to load
- Proper foreground for initials display
- The image loading flag is bindable

## Notes

- Initials are automatically extracted from the name (first letter of first two words)
- Avatar image uses object-cover to maintain aspect ratio
- Prefix badge is positioned at bottom-left, behind the image
- Suffix badge is positioned at bottom-right, absolute positioning
- Avatar group creates overlapping effect with negative margins
- \`loading\` is true only while the image request is in flight; a failed image falls back to the initials
- Each new \`src\` is loaded from scratch: \`loading\` goes true again and a working URL recovers the picture after a broken one

## Theme Customization

The Avatar component uses a theme object that can be customized using the \`theme\` prop or by setting a global theme.

### Theme Structure

The theme object contains the following parts:
- **root**: Main avatar container styles
- **avatarImage**: Avatar image element styles
- **avatarPrefix**: Prefix badge styles (bottom-left)
- **avatarSuffix**: Suffix badge styles (bottom-right)
- **avatarInitials**: Fallback initials display styles

### Theme Type Definition

\`\`\`typescript
import type { AvatarThemeProps } from 'svelai/avatar';

// Example theme customization
const customTheme: AvatarThemeProps = {
  root: {
    base: 'custom-base-classes',
    size: {
      small: 'size-6',
      normal: 'size-8',
      large: 'size-10'
    }
  },
  avatarImage: {
    size: {
      small: '',
      normal: '',
      large: ''
    }
  },
  avatarPrefix: {
    size: {
      small: 'size-5 right-[-0.25rem] bottom-[-0.25rem]',
      normal: 'size-4 right-[-0.3rem] bottom-[-0.2rem]',
      large: 'size-5 left-[-0.4rem] bottom-[-0.4rem]'
    }
  },
  avatarSuffix: {
    size: {
      small: 'size-3.5 left-[-0.25rem] bottom-[-0.25rem]',
      normal: 'size-4 right-[-0.3rem] bottom-[-0.3rem]',
      large: 'size-3.5 right-[-0.4rem] bottom-[-0.4rem]'
    }
  },
  avatarInitials: {
    size: {
      small: 'text-xs',
      normal: 'text-sm',
      large: 'text-base'
    }
  }
};
\`\`\`

### Available Variants

**root**:
- base: Base classes applied to all avatars
- Variants:
  - size: 'small' | 'normal' | 'large' - Controls avatar dimensions (6/8/10)

**avatarImage**:
- base: Base classes for avatar image
- Variants:
  - size: 'small' | 'normal' | 'large' - Inherited from avatar size

**avatarPrefix**:
- base: Base classes for prefix badge
- Variants:
  - size: 'small' | 'normal' | 'large' - Badge size and positioning based on avatar size

**avatarSuffix**:
- base: Base classes for suffix badge
- Variants:
  - size: 'small' | 'normal' | 'large' - Badge size and positioning based on avatar size

**avatarInitials**:
- base: Base classes for initials fallback
- Variants:
  - size: 'small' | 'normal' | 'large' - Text size based on avatar size

### Usage Examples

**Basic Theme Override**:
\`\`\`svelte
<Avatar 
  name="John Doe"
  theme={{
    root: {
      base: 'ring-2 ring-primary',
      size: {
        large: 'size-12'
      }
    },
    avatarInitials: {
      size: {
        large: 'text-lg'
      }
    }
  }}
/>
\`\`\`

**Custom Badge Styling**:
\`\`\`svelte
<Avatar
  name="Jane Smith"
  theme={{
    avatarSuffix: {
      size: {
        normal: 'size-5 ring-2 ring-white'
      }
    }
  }}
>
  {#snippet suffix()}
    <div class="w-3 h-3 bg-success rounded-full"></div>
  {/snippet}
</Avatar>
\`\`\`

**Global Theme Setting**:
\`\`\`svelte
<script>
  import { setAvatarTheme } from 'svelai/avatar';
  
  setAvatarTheme({
    root: {
      base: 'ring-2 ring-neutral-muted transition-all',
      size: {
        normal: 'size-10'
      }
    },
    avatarInitials: {
      base: 'font-bold'
    }
  });
</script>
\`\`\`
`;
