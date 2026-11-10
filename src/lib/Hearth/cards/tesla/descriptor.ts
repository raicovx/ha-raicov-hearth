import type { CardDescriptor } from '../types';
import { teslaCard as definition, type TeslaCard } from '../../model/cards/tesla';
export type { TeslaCard } from '../../model/cards/tesla';

export const teslaCard: CardDescriptor<TeslaCard> = {
	...definition,
	load: () => import('./Card.svelte'),
	editor: () => import('./Editor.svelte')
};
