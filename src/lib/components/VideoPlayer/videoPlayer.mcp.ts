export const videoPlayerDescription = `
# VideoPlayer Component

VideoPlayer is a native HTML5 video player with Svelai chrome. It keeps the media engine dependency-free and composes controls from Button, Popover, PopupMenu/Menu, AspectRatio, and the shared Slider primitive.

## Import

\`\`\`svelte
<script lang="ts">
	import { VideoPlayer } from 'svelai/video-player';
</script>
\`\`\`

## Basic Usage

\`\`\`svelte
<VideoPlayer
	src="/videos/demo.mp4"
	poster="/videos/demo-poster.jpg"
	title="Product demo"
/>
\`\`\`

## Multiple Sources and Tracks

\`\`\`svelte
<VideoPlayer
	title="Launch recap"
	poster="/videos/launch.jpg"
	sources={[
		{ src: '/videos/launch.webm', type: 'video/webm' },
		{ src: '/videos/launch.mp4', type: 'video/mp4' }
	]}
	tracks={[
		{ id: 'en', src: '/captions/launch-en.vtt', kind: 'captions', srclang: 'en', label: 'English' },
		{ id: 'fr', src: '/captions/launch-fr.vtt', kind: 'subtitles', srclang: 'fr', label: 'French' }
	]}
/>
\`\`\`

## Props

### Media
- **src**: string - Single source URL.
- **srcType**: string - MIME type for \`src\`.
- **sources**: VideoPlayerSource[] - Multiple source candidates rendered as native \`<source>\` elements.
- **tracks**: VideoPlayerTrack[] - Captions, subtitles, descriptions, chapters, or metadata tracks.
- **poster**: string - Poster image.
- **title** / **label**: string - Accessible media/player labels; \`label\` overrides \`title\`.
- **preload**: 'none' | 'metadata' | 'auto' = 'metadata'.
- **crossOrigin**: 'anonymous' | 'use-credentials' | ''.
- **playsInline**: boolean = true.
- **autoplay**: boolean = false.
- **nativeControls**: boolean = false - Enables browser-native controls alongside or instead of custom controls.

### Controls
- **controls**: VideoPlayerControl[] - Custom controls to render. Defaults to play, seek backward/forward, time, seek, volume, settings, PiP, download, fullscreen.
- **playbackRates**: number[] = [0.5, 0.75, 1, 1.25, 1.5, 2].
- **autoHideControls**: boolean = true - Hides controls during playback after pointer/keyboard inactivity. Playback starts the hide timer; open popovers stay visible. Set false to keep controls visible.
- **hideControlsDelay**: number = 1200.
- **timeVariant**: 'elapsed' | 'remaining' | 'duration' = 'elapsed'.
- **download**: boolean | string = true - true uses the selected media source, string uses the provided href, false hides download.
- **disabled**: boolean = false - Disables custom controls, methods, and keyboard shortcuts.
- **keyboardShortcuts**: boolean = true - space/k play-pause, arrows seek/volume, m mute, f fullscreen, p Picture-in-Picture, c captions.
- **seekStep**: number = 10.
- **volumeStep**: number = 0.05.

### State Bindings
- **currentTime**, **duration**, **buffered**: number.
- **volume**: number from 0 to 1.
- **muted**, **paused**, **ended**, **loop**: boolean.
- **playbackRate**: number.
- **fullscreen** and **pictureInPicture**: actual browser state; setting these props does not request the mode.
- **captionsEnabled**: boolean.
- **activeTextTrack**: string | null - Track id, label, srclang/language, or \`kind:index\`.
- **error**: MediaError | Error | null.
- **ref**: HTMLVideoElement | null.
- **rootRef**: HTMLDivElement | null.

### Layout and Theme
- **size**: 'small' | 'normal' | 'large' = 'normal'.
- **ratio**: AspectRatio ratio | 'auto' = '16x9'.
- **class**: string.
- **theme**: VideoPlayerThemeProps.

### Slots
- **children**: custom content inside the \`<video>\` element after generated source/track tags.
- **overlay**: replaces the overlay layer.
- **loading**, **errorContent**, **empty**: replace default loading/error/empty panels.

### Events
- **onPlay**, **onPause**, **onEnded**, **onTimeUpdate**, **onDurationChange**, **onVolumeChange**, **onRateChange**, **onLoopChange**, **onFullscreenChange**, **onPictureInPictureChange**, **onCaptionsChange** receive a VideoPlayerSnapshot.
- **onError** receives \`{ error, snapshot }\`.

## Methods

The component exports imperative methods:

- **play()**, **pause()**, **togglePlay()**, **load()**.
- **seekTo(time)**, **seekBy(delta)**.
- **setVolume(volume)**, **setMuted(muted)**, **setPlaybackRate(rate)**, **setLoop(loop)**.
- **setCaptionsEnabled(enabled)**, **setActiveTextTrack(trackId)**.
- **toggleFullscreen()**, **togglePictureInPicture()**.
- **getSnapshot()**.

## Examples

### Minimal Controls
\`\`\`svelte
<VideoPlayer src="/videos/demo.mp4" controls={['play', 'seek', 'time', 'fullscreen']} />
\`\`\`

### Default Auto-hide Controls
\`\`\`svelte
<VideoPlayer src="/videos/demo.mp4" />
\`\`\`

### Controlled State
\`\`\`svelte
<script lang="ts">
	let paused = $state(true);
	let currentTime = $state(0);
</script>

<VideoPlayer
	src="/videos/demo.mp4"
	bind:paused
	bind:currentTime
	onTimeUpdate={(payload) => console.log(payload.currentTime)}
/>
\`\`\`

## Accessibility

- The root is a labelled region with keyboard shortcuts when enabled.
- Icon controls use accessible labels and explicit pressed state for toggles.
- Auto-hidden controls become inert. Focus reveals controls temporarily during playback; popovers and menus keep them visible while open.
- Captions state is reconciled from native text tracks so the public state only reports active captions when a track is actually showing.

## Notes

- HLS, DASH, Shaka, and DRM are not bundled. Use native browser support or compose a future engine through sources/slots.
- Picture-in-Picture and fullscreen controls are disabled when unsupported by the current browser.
`;
