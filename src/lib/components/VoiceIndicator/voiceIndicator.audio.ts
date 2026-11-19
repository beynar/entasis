// Web Audio plumbing shared by every voice indicator: one AudioContext for the page, one source
// node per stream (counted, so several indicators can follow the same microphone) and one
// AnalyserNode per indicator. Nothing is connected to the destination: the audio is measured,
// never played back.
//
// @license Portions adapted from Voice Ring (libraries.dev/voice-ring).
// Copyright (c) 2026 Jakub Antalik. SPDX-License-Identifier: MIT

type AudioContextConstructor = typeof AudioContext;

let context: AudioContext | null = null;

function audioContextConstructor(): AudioContextConstructor | null {
	if (typeof window === 'undefined') return null;
	const scope = window as unknown as {
		AudioContext?: AudioContextConstructor;
		webkitAudioContext?: AudioContextConstructor;
	};
	return scope.AudioContext ?? scope.webkitAudioContext ?? null;
}

/**
 * The page's shared AudioContext, created on first use and resumed on every call. Safari only
 * lets a context start inside a user gesture, so call it from the press that starts the session.
 */
export function getVoiceAudioContext(): AudioContext | null {
	const Constructor = audioContextConstructor();
	if (!Constructor) return null;
	context ??= new Constructor();
	if (context.state === 'suspended') {
		// A resume outside a gesture may be refused; the next gesture retries.
		context.resume().catch(() => {});
	}
	return context;
}

type SharedSource = { node: MediaStreamAudioSourceNode; leases: number };

const sources = new WeakMap<MediaStream, SharedSource>();

export type AnalyserLease = { analyser: AnalyserNode; release: () => void };

/** An AnalyserNode fed by `stream`, or null without Web Audio or without an audio track. */
export function acquireAnalyser(stream: MediaStream): AnalyserLease | null {
	const audio = getVoiceAudioContext();
	if (!audio || stream.getAudioTracks().length === 0) return null;

	let shared = sources.get(stream);
	if (!shared) {
		shared = { node: audio.createMediaStreamSource(stream), leases: 0 };
		sources.set(stream, shared);
	}
	const source = shared;
	source.leases += 1;

	const analyser = audio.createAnalyser();
	// 1024 bins at 48 kHz is about 47 Hz a bin: enough to tell the voice bands apart.
	analyser.fftSize = 1024;
	// The follower has its own attack and release; this only takes the flicker off the spectrum.
	analyser.smoothingTimeConstant = 0.5;
	source.node.connect(analyser);

	let released = false;
	return {
		analyser,
		release: () => {
			if (released) return;
			released = true;
			try {
				source.node.disconnect(analyser);
			} catch {
				// Already disconnected.
			}
			source.leases -= 1;
			if (source.leases > 0) return;
			try {
				source.node.disconnect();
			} catch {
				// Already disconnected.
			}
			sources.delete(stream);
		}
	};
}
