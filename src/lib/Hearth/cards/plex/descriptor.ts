import type { CardDescriptor } from '../types';
import Card from './Card.svelte';
import { plexCard as definition, type PlexCard } from '../../model/cards/plex';
export type { PlexCard } from '../../model/cards/plex';

export const plexCard: CardDescriptor<PlexCard> = {
	...definition,
	component: Card,
	editor: () => import('./Editor.svelte')
};
