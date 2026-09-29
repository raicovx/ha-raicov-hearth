import type { CardDescriptor } from '../types';
import { plexCard as definition, type PlexCard } from '../../model/cards/plex';
export type { PlexCard } from '../../model/cards/plex';

export const plexCard: CardDescriptor<PlexCard> = {
	...definition,
	load: () => import('./Card.svelte'),
	editor: () => import('./Editor.svelte')
};
