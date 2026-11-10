import type { CardDescriptor } from '../types';
import {
	spotifyRecentCard as definition,
	type SpotifyRecentCard
} from '../../model/cards/spotify_recent';
export type { SpotifyRecentCard } from '../../model/cards/spotify_recent';

export const spotifyRecentCard: CardDescriptor<SpotifyRecentCard> = {
	...definition,
	load: () => import('./Card.svelte'),
	editor: () => import('./Editor.svelte')
};
