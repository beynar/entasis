import { getVoiceAudioContext } from './voiceIndicator.audio.js';

/**
 * Where the microphone is: not asked for, waiting on the person's answer, live, refused by the
 * person, not available in this browser or page, or failed for another reason.
 */
export type VoiceMicrophoneStatus =
	'idle' | 'requesting' | 'active' | 'denied' | 'unsupported' | 'error';

/**
 * The microphone as reactive state, for a VoiceIndicator's `input`. `start()` asks for it and
 * must be called from a press, since browsers only start audio inside a user gesture; `stop()`
 * releases it, and so should the component that owns it when it is destroyed.
 */
export class VoiceMicrophone {
	#stream = $state.raw<MediaStream | null>(null);
	#status = $state<VoiceMicrophoneStatus>('idle');
	#error = $state.raw<unknown>(null);
	// Each start and stop takes a new number, so a late answer to an older request is dropped.
	#request = 0;

	/** The live stream, or null. */
	get stream() {
		return this.#stream;
	}

	get status() {
		return this.#status;
	}

	/** What the browser rejected the last request with, if it did. */
	get error() {
		return this.#error;
	}

	get active() {
		return this.#status === 'active';
	}

	/** Asks for the microphone. Resolves with the stream, or null when there is none to give. */
	async start(constraints: MediaTrackConstraints = {}): Promise<MediaStream | null> {
		if (this.#stream) return this.#stream;
		const devices = typeof navigator === 'undefined' ? undefined : navigator.mediaDevices;
		if (!devices?.getUserMedia) {
			this.#status = 'unsupported';
			return null;
		}
		const request = ++this.#request;
		this.#status = 'requesting';
		this.#error = null;
		// Inside the gesture, so the context that will measure the stream is allowed to run.
		getVoiceAudioContext();
		try {
			const stream = await devices.getUserMedia({
				audio: { echoCancellation: true, noiseSuppression: true, ...constraints }
			});
			if (request !== this.#request) {
				for (const track of stream.getTracks()) track.stop();
				return null;
			}
			this.#stream = stream;
			this.#status = 'active';
			return stream;
		} catch (error) {
			if (request !== this.#request) return null;
			this.#error = error;
			const name = error instanceof Error ? error.name : '';
			this.#status = name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'error';
			return null;
		}
	}

	/** Releases the microphone: the browser's recording mark goes away. */
	stop(): void {
		this.#request++;
		for (const track of this.#stream?.getTracks() ?? []) track.stop();
		this.#stream = null;
		this.#status = 'idle';
	}

	async toggle(constraints?: MediaTrackConstraints): Promise<void> {
		if (this.#stream || this.#status === 'requesting') this.stop();
		else await this.start(constraints);
	}
}
