import { writable } from 'svelte/store';
import type { PlexCard } from './model/cards/plex';
import type { PlexItem, PlexSection } from './plex';

/*
 * Kept apart from plex.ts so the dashboard can watch for the popup without
 * loading the Plex client code with its first frame.
 */

/** What the Plex browser popup shows; null when it is closed. */
export type PlexBrowser = {
	card: PlexCard;
	start: { kind: 'library'; section: PlexSection } | { kind: 'item'; item: PlexItem };
};

export const plexBrowser = writable<PlexBrowser | null>(null);
