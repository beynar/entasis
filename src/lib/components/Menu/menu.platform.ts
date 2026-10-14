type NavigatorWithData = Navigator & { userAgentData?: { platform?: string } };

/**
 * Whether the page runs on an Apple platform (macOS, iOS, iPadOS), where VoiceOver reads the
 * state of a submenu trigger again when focus moves into its submenu.
 */
export const isApplePlatform = (): boolean => {
	if (typeof navigator === 'undefined') return false;
	const nav = navigator as NavigatorWithData;
	const platform = nav.userAgentData?.platform || nav.platform || nav.userAgent || '';
	return /Mac|iPhone|iPad|iPod/i.test(platform);
};
