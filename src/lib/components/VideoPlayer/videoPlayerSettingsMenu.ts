import type { MenuItem } from '../Menu/menu.props.js';
import { checkIcon } from '../Icons/check.js';
import { closedCaptioningIcon } from '../Icons/closedCaptioning.js';
import { cornersInIcon } from '../Icons/cornersIn.js';
import { cornersOutIcon } from '../Icons/cornersOut.js';
import { downloadSimpleIcon } from '../Icons/downloadSimple.js';
import { pictureInPictureIcon } from '../Icons/pictureInPicture.js';
import { repeatIcon } from '../Icons/repeat.js';
import { speedometerIcon } from '../Icons/speedometer.js';
import { subtitlesSlashIcon } from '../Icons/subtitlesSlash.js';
import type { VideoPlayerTrack } from './videoPlayer.props.js';
import type { VideoPlayerState } from './videoPlayer.state.svelte.js';
import type { useVideoPlayerTheme } from './videoPlayer.theme.js';
import { en, type Messages } from '$lib/i18n/en.js';

type VideoPlayerClasses = ReturnType<typeof useVideoPlayerTheme>;
type CaptionTrackOption = {
	value: string;
	label: string;
};
type VideoPlayerSubmenuItem = Extract<MenuItem, { type: 'submenu' }> & {
	popoverClass?: string;
};

type VideoPlayerSettingsMenuOptions = {
	player: VideoPlayerState;
	classes: VideoPlayerClasses;
	tracks: VideoPlayerTrack[];
	playbackRates: number[];
	disabled: boolean;
	includeRate: boolean;
	includeLoop: boolean;
	includeCaptions: boolean;
	includePictureInPicture: boolean;
	includeDownload: boolean;
	includeFullscreen: boolean;
	downloadHref: string;
	runIfEnabled: (action: () => void) => void;
	/** Active i18n catalog, used for the menu item titles. */
	messages?: Messages;
};

export function getVideoPlayerSettingsMenuItems({
	player,
	classes,
	tracks,
	playbackRates,
	disabled,
	includeRate,
	includeLoop,
	includeCaptions,
	includePictureInPicture,
	includeDownload,
	includeFullscreen,
	downloadHref,
	runIfEnabled,
	messages = en
}: VideoPlayerSettingsMenuOptions): MenuItem[] {
	const items: MenuItem[] = [];
	const availableRates = getAvailablePlaybackRates(playbackRates);
	const captionTracks = getCaptionTrackOptions(tracks, messages);

	if (includeRate && availableRates.length > 0) {
		const speedItem: VideoPlayerSubmenuItem = {
			type: 'submenu',
			title: messages.mediaSpeedLabel,
			prefix: speedometerIcon,
			suffix: formatPlaybackRate(player.playbackRate, messages),
			disabled,
			popoverClass: classes.popoverPanel({ className: 'p-1' }),
			menu: availableRates.map((rate) => ({
				type: 'option',
				title: formatPlaybackRate(rate, messages),
				disabled,
				selected: player.playbackRate === rate,
				suffix: player.playbackRate === rate ? checkIcon : undefined,
				onclick: () => runIfEnabled(() => player.setPlaybackRate(rate))
			}))
		};
		items.push(speedItem);
	}

	if (includeLoop) {
		items.push({
			type: 'option',
			title: messages.loop,
			prefix: repeatIcon,
			disabled,
			selected: player.loop,
			suffix: player.loop ? checkIcon : undefined,
			onclick: () => runIfEnabled(() => player.setLoop(!player.loop))
		});
	}

	if (includeCaptions) {
		items.push(
			getCaptionsMenuItem({ player, classes, disabled, captionTracks, runIfEnabled, messages })
		);
	}

	const actionItems = getActionMenuItems({
		player,
		disabled,
		includePictureInPicture,
		includeDownload,
		includeFullscreen,
		downloadHref,
		runIfEnabled,
		messages
	});

	if (actionItems.length > 0) {
		if (items.length > 0) items.push({ type: 'separator' });
		items.push(...actionItems);
	}

	return items;
}

function getAvailablePlaybackRates(playbackRates: number[]) {
	return playbackRates
		.filter((rate) => Number.isFinite(rate) && rate > 0)
		.filter((rate, index, rates) => rates.indexOf(rate) === index);
}

function getCaptionTrackOptions(tracks: VideoPlayerTrack[], messages: Messages) {
	return tracks
		.map((track, index) => getCaptionTrackOption(track, index, messages))
		.filter((track): track is CaptionTrackOption => track !== null);
}

function getCaptionTrackOption(track: VideoPlayerTrack, index: number, messages: Messages) {
	const kind = track.kind ?? 'subtitles';
	if (kind !== 'captions' && kind !== 'subtitles') return null;
	const value = track.id ?? track.label ?? track.srclang ?? `${kind}:${index}`;
	return {
		value,
		label: track.label ?? track.srclang ?? messages.mediaTrack(index + 1)
	};
}

function getCaptionsMenuItem({
	player,
	classes,
	disabled,
	captionTracks,
	runIfEnabled,
	messages
}: Pick<VideoPlayerSettingsMenuOptions, 'player' | 'classes' | 'disabled' | 'runIfEnabled'> & {
	captionTracks: CaptionTrackOption[];
	messages: Messages;
}): VideoPlayerSubmenuItem {
	const captionsDisabled = disabled || captionTracks.length === 0;
	return {
		type: 'submenu',
		title: messages.captions,
		prefix: player.captionsEnabled ? closedCaptioningIcon : subtitlesSlashIcon,
		disabled: captionsDisabled,
		popoverClass: classes.popoverPanel({ className: 'p-1' }),
		menu: [
			{
				type: 'option',
				title: messages.captionsOff,
				disabled: captionsDisabled,
				selected: !player.captionsEnabled,
				suffix: !player.captionsEnabled ? checkIcon : undefined,
				onclick: () => runIfEnabled(() => player.setActiveTextTrack(null))
			},
			...captionTracks.map((track) => ({
				type: 'option' as const,
				title: track.label,
				disabled: captionsDisabled,
				selected: player.activeTextTrack === track.value,
				suffix: player.activeTextTrack === track.value ? checkIcon : undefined,
				onclick: () => runIfEnabled(() => player.setActiveTextTrack(track.value))
			}))
		]
	};
}

function getActionMenuItems({
	player,
	disabled,
	includePictureInPicture,
	includeDownload,
	includeFullscreen,
	downloadHref,
	runIfEnabled,
	messages
}: Pick<
	VideoPlayerSettingsMenuOptions,
	| 'player'
	| 'disabled'
	| 'includePictureInPicture'
	| 'includeDownload'
	| 'includeFullscreen'
	| 'downloadHref'
	| 'runIfEnabled'
> & { messages: Messages }): MenuItem[] {
	const actionItems: MenuItem[] = [];

	if (includePictureInPicture) {
		actionItems.push({
			type: 'option',
			title: player.actualPictureInPicture
				? messages.exitPictureInPicture
				: messages.pictureInPicture,
			prefix: pictureInPictureIcon,
			disabled: disabled || !player.supportsPictureInPicture,
			selected: player.actualPictureInPicture,
			suffix: player.actualPictureInPicture ? checkIcon : undefined,
			onclick: () => runIfEnabled(() => player.togglePictureInPicture())
		});
	}

	if (includeDownload && downloadHref) {
		actionItems.push({
			type: 'option',
			title: messages.download,
			prefix: downloadSimpleIcon,
			disabled: disabled || !downloadHref,
			href: disabled ? undefined : downloadHref,
			attrs: { download: true }
		});
	}

	if (includeFullscreen) {
		actionItems.push({
			type: 'option',
			title: player.actualFullscreen ? messages.exitFullscreen : messages.fullscreen,
			prefix: player.actualFullscreen ? cornersInIcon : cornersOutIcon,
			disabled: disabled || !player.supportsFullscreen,
			selected: player.actualFullscreen,
			suffix: player.actualFullscreen ? checkIcon : undefined,
			onclick: () => runIfEnabled(() => player.toggleFullscreen())
		});
	}

	return actionItems;
}

function formatPlaybackRate(rate: number, messages: Messages) {
	return rate === 1 ? messages.mediaNormalSpeed : `${rate}x`;
}
