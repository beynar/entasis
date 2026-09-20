export const audioPlayerDescription = `
# AudioPlayer Component

AudioPlayer is a native HTML5 audio player with Entasis chrome. It can render a
waveform or track seek/progress surface and composes controls from Button, Tooltip,
Popover, and the shared Slider primitive.

## Import

\`\`\`ts
import { AudioPlayer } from 'entasis/audio-player';
\`\`\`

## Core Props

- **src**: string - Single audio source URL.
- **sources**: AudioPlayerSource[] - Multiple native source candidates.
- **title**: string - Track title.
- **label**: string - Accessible player label; falls back to \`title\`.
- **artist**: string - Secondary metadata line.
- **artwork**: string | false - Optional artwork image URL. Omitted artwork renders no fallback.
- **variant**: 'waveform' | 'track' - Primary progress surface.
- **layout**: 'block' | 'inline' - Controls/progress arrangement. Block stacks the seek surface below the header; inline places controls and seek on the same row when space allows.
- **color**: Colors - Theme color for controls and progress fill.
- **waveform**: number[] - Amplitude samples from 0 to 1. When omitted, samples are generated from the selected audio source when possible.
- **waveformVariant**: 'centered' | 'histogram' - Waveform visual mode.
- **waveformBars**: number - Number of bars rendered after resampling.
- **controls**: AudioPlayerControl[] - Toggle play, seek, time, volume, loop, download.
- **header**: Snippet<[AudioPlayerState]> - Replaces the full default header row.
- **controlsSlot**: Snippet<[AudioPlayerState]> - Replaces the default controls area.
- **leading**: Snippet<[AudioPlayerState]> - Renders before default metadata.
- **trailing**: Snippet<[AudioPlayerState]> - Renders after default controls.
- **seek**: Snippet<[AudioPlayerState]> - Replaces the waveform or track seek surface.
- **download**: boolean | string - true uses the selected source, string uses that href.
- **theme**: AudioPlayerThemeProps - Per-instance theme overrides.

## Notes

The waveform and track surfaces are both seek inputs with an invisible range hitbox.
When no waveform samples are provided, the component fetches and decodes the selected
audio source in the browser to generate peak samples. While generation is pending, or
if fetch/decode is unavailable, it uses a deterministic fallback waveform from source
and metadata. Generation failures are reported through onError.
`;
