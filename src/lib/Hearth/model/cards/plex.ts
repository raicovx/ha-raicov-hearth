import * as v from 'valibot';
import type { OverviewCard } from '../../types';
import { trimmedOrUndefined } from '../../normalizers';
import type { CardDefinition } from '../types';
import { OptionalEntityIdList, OptionalText, OptionalTextList } from '../../schema';

export type PlexCard = Extract<OverviewCard, { type: 'plex' }>;

function textList(raw: unknown): string[] | undefined {
	if (!Array.isArray(raw)) return undefined;
	const list = raw.map((entry) => (typeof entry === 'string' ? entry.trim() : '')).filter(Boolean);
	return list.length ? list : undefined;
}

export const plexCard: CardDefinition<PlexCard> = {
	type: 'plex',
	label: 'hearth_card_plex_label',
	name: 'hearth_card_plex_name',
	sub: 'hearth_card_plex_sub',
	icon: 'movie',
	normalize: (card) => ({
		title: trimmedOrUndefined(card.title),
		libraries: textList(card.libraries),
		players: textList(card.players)
	}),
	schema: v.looseObject({
		title: OptionalText,
		libraries: OptionalTextList,
		players: OptionalEntityIdList
	}),
	// the server comes from the app settings, so the card has nothing it must be given
	needsConfiguration: () => false,
	entityIds: (card) => card.players ?? []
};
