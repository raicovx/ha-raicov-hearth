import type { CardDescriptor } from '../types';
import Card from './Card.svelte';
import {
	spotifyRecentCard as definition,
	type SpotifyRecentCard
} from '../../model/cards/spotify_recent';
export type { SpotifyRecentCard } from '../../model/cards/spotify_recent';

export const spotifyRecentCard: CardDescriptor<SpotifyRecentCard> = {
	...definition,
	component: Card,
	editor: () => import('./Editor.svelte')
};
