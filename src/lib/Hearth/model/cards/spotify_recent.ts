import * as v from 'valibot';
import type { OverviewCard } from '../../types';
import { normalizeWholeNumber, trimmedOrUndefined } from '../../normalizers';
import type { CardDefinition } from '../types';
import { OptionalEntityId, OptionalText, optionalNumberAtLeast } from '../../schema';

export type SpotifyRecentCard = Extract<OverviewCard, { type: 'spotify_recent' }>;

/** Spotify keeps the last 50 plays; the row shows this many unless told otherwise. */
export const SPOTIFY_RECENT_MAX = 50;
export const SPOTIFY_RECENT_DEFAULT = 20;

export const spotifyRecentCard: CardDefinition<SpotifyRecentCard> = {
	type: 'spotify_recent',
	label: 'hearth_card_spotify_recent_label',
	name: 'hearth_card_spotify_recent_name',
	sub: 'hearth_card_spotify_recent_sub',
	icon: 'history',
	normalize: (card) => {
		const limit = normalizeWholeNumber(card.limit, 1);
		return {
			entity: trimmedOrUndefined(card.entity),
			title: trimmedOrUndefined(card.title),
			limit: limit === undefined ? undefined : Math.min(limit, SPOTIFY_RECENT_MAX),
			default_device: trimmedOrUndefined(card.default_device)
		};
	},
	schema: v.looseObject({
		entity: OptionalEntityId,
		title: OptionalText,
		limit: optionalNumberAtLeast(1),
		default_device: OptionalText
	}),
	needsConfiguration: (card) => !card.entity,
	entityIds: (card) => (card.entity ? [card.entity] : [])
};
