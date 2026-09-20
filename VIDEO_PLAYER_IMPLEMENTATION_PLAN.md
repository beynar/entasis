# VideoPlayer Implementation Plan

## Goal

Build a first-class Entasis `VideoPlayer` component that wraps native HTML5 video playback with a fully propsified control surface composed from existing Entasis primitives where they fit: `Button`, `SliderState`/slider track primitives, `Popover`, `PopupMenu`, `Menu`, `MenuOption`, `AspectRatio`, and theme CVA parts.

## Research Notes

- Official shadcn/ui does not ship a video player; it ships primitives and positions the ecosystem as copy-owned code that teams customize in their own design system: <https://ui.shadcn.com/docs>.
- Dice UI’s shadcn-adjacent `Media Player` is the closest complete reference. Its useful patterns are compound controls, data attributes for state, loading/error surfaces, controls visibility, seek/volume sliders, settings menu, playback speed, loop, captions, PiP, fullscreen, and download controls: <https://diceui.com/docs/components/base/media-player>.
- Shadix UI’s `Video Player` is a simpler shadcn registry component focused on `src`, progress, volume, and fullscreen: <https://shadix-ui.vercel.app/docs/components/video-player>.
- Creative Tim’s shadcn video examples stay close to native `<video>` and mostly demonstrate `controls`, `autoplay`, `loop`, and `muted`: <https://www.creative-tim.com/ui/docs/components/video>.
- Limeplay-style players add Shaka/HLS/DASH/DRM engines. That is outside the first Entasis component; the initial component should stay dependency-free and expose slots/props for future engine integration: <https://allshadcn.com/tools/limeplay/>.

## Local Constraints

- Entasis components expose `index.ts`, `*.props.ts`, `*.theme.ts`, optional `*.state.svelte.ts`, `*.mcp.ts`, and a docs route under `src/routes/components/<component>/+page.svelte`.
- Theme parts use `cva`, `setComponentTheme`, `useComponentTheme`, and `InferComponentTheme`.
- `Button`, `Popover`, `PopupMenu`, `Menu`, `MenuOption`, `AspectRatio`, and icon snippets are directly reusable.
- `Slider` itself is currently a Form field. For media controls we should reuse the exported `SliderState` and internal track pattern, or build a small VideoPlayer slider subcomponent that uses the same state/theme conventions without introducing `Field` wrappers.
- No new playback dependency in the first implementation. Native APIs cover the requested baseline: play/pause, seeking, volume, mute, playback rate, loop, captions tracks, fullscreen, PiP, download, poster, preload, autoplay, playsinline, and media events.

## Public API Shape

One high-level component first:

```svelte
<VideoPlayer
	src="..."
	poster="..."
	title="Demo"
	controls={['play', 'seek', 'time', 'volume', 'settings', 'captions', 'pip', 'fullscreen']}
	playbackRates={[0.5, 1, 1.25, 1.5, 2]}
	defaultVolume={0.8}
	autoHideControls
/>
```

Planned prop groups:

- Media: `src`, `sources`, `tracks`, `poster`, `preload`, `crossorigin`, `playsInline`, `autoplay`, `muted`, `loop`.
- State bindings: `paused`, `currentTime`, `duration`, `volume`, `muted`, `playbackRate`, `fullscreen`, `pictureInPicture`, `captionsEnabled`.
- Controls: `controls`, `controlLayout`, `autoHideControls`, `hideControlsDelay`, `keyboardShortcuts`, `seekStep`, `volumeStep`, `playbackRates`, `download`, `fullscreenTarget`.
- Events: `onPlay`, `onPause`, `onEnded`, `onTimeUpdate`, `onDurationChange`, `onVolumeChange`, `onRateChange`, `onError`, `onFullscreenChange`, `onPictureInPictureChange`, `onCaptionsChange`.
- Slots/snippets: `overlay`, `loading`, `error`, `empty`, `controlsStart`, `controlsEnd`.
- Theme: `VideoPlayerThemeProps`, with CVA parts for root, media, overlay, controls, buttons, sliders, time, menus, loading, error, captions.

## Phase 1: Media Core

Build the state and shell.

- Add `src/lib/components/VideoPlayer/videoPlayer.props.ts`.
- Add `src/lib/components/VideoPlayer/videoPlayer.state.svelte.ts`.
- Add `src/lib/components/VideoPlayer/videoPlayer.theme.ts`.
- Add `src/lib/components/VideoPlayer/VideoPlayer.svelte` with:
  - native `<video>` binding
  - media source/track rendering
  - event synchronization into bindable props
  - play/pause, seek, volume, mute, rate, loop, fullscreen, PiP, captions methods
  - loading/error/empty states
  - keyboard shortcut handling
- Gate: focused Svelte check on `VideoPlayer`, then sub-agent adversarial review of state synchronization and API correctness.

## Phase 2: Controls

Build the complete control surface from existing primitives.

- Add focused subcomponents only if they remove real complexity:
  - `VideoPlayerIconButton.svelte`
  - `VideoPlayerSlider.svelte`
  - `VideoPlayerSettings.svelte`
  - `VideoPlayerTime.svelte`
- Reuse:
  - `Button` for icon controls
  - `SliderState` plus local themed slider markup for seek and volume
  - `PopupMenu`/`MenuOption` for settings, captions, and rate menus
  - `Popover` for hover previews only if needed
  - existing icon snippets for media controls
- Include controls for:
  - play/pause
  - seek backward/forward
  - seek bar with buffered progress
  - current time, duration, remaining time
  - mute and volume
  - playback rate
  - loop
  - captions/subtitles
  - PiP
  - download
  - fullscreen
- Gate: focused Svelte check, browser smoke test, sub-agent adversarial review of control behavior, accessibility, and primitive reuse.

## Phase 3: Docs and Registry Surface

Expose and document the component.

- Add `src/lib/components/VideoPlayer/index.ts`.
- Add `src/lib/components/VideoPlayer/videoPlayer.mcp.ts`.
- Add `src/routes/components/video-player/+page.svelte`.
- Add sidebar navigation entry.
- Include docs examples:
  - basic video
  - all controls
  - minimal controls
  - captions/tracks
  - custom theme/compact player
  - controlled state callbacks
- Gate: route returns 200, docs examples render, props table includes the expected prop comments, final sub-agent review of docs/API consistency.

## Review Protocol

Each phase must pass before the next phase starts:

1. Main-agent self-review against component size, dead code, error propagation, API validity, and local conventions.
2. Sub-agent adversarial review scoped to the phase’s changed files.
3. Fix all material findings.
4. Re-run the focused diagnostics that are relevant to the fixed files.

Full `npm run check` currently fails in this worktree for unrelated existing route/tooling errors. Verification should therefore include focused diagnostics plus browser checks for the new route.
