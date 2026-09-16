/* eslint-disable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unsafe-declaration-merging -- Descriptor binding follows the established Svelai state-class pattern. */
import {
	MediaPlayerState,
	type MediaPlayerCallbacks,
	type MediaPlayerNouns,
	type MediaPlayerStateOptions
} from '../MediaVolume/mediaPlayer.state.svelte.js';
import type { AudioPlayerErrorPayload, AudioPlayerSnapshot } from './audioPlayer.props.js';

type AudioPlayerCallbacks = MediaPlayerCallbacks<AudioPlayerSnapshot> & {
	onError?: (payload: AudioPlayerErrorPayload) => void;
};

type AudioPlayerStateOptions = MediaPlayerStateOptions<AudioPlayerSnapshot, AudioPlayerCallbacks>;

export interface AudioPlayerState extends AudioPlayerStateOptions {}

export class AudioPlayerState extends MediaPlayerState<
	HTMLAudioElement,
	AudioPlayerSnapshot,
	AudioPlayerCallbacks
> {
	protected readonly nouns: MediaPlayerNouns = { media: 'audio', player: 'Audio' };

	get snapshot(): AudioPlayerSnapshot {
		return this.mediaSnapshot;
	}

	protected override handlePlayerKeydown(key: string, event: KeyboardEvent) {
		if (key !== 'l') return;
		event.preventDefault();
		this.setLoop(!this.loop);
	}
}
