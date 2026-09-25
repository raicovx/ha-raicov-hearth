import type { CardDescriptor } from '../types';
import Card from './Card.svelte';
import { teslaCard as definition, type TeslaCard } from '../../model/cards/tesla';
export type { TeslaCard } from '../../model/cards/tesla';

export const teslaCard: CardDescriptor<TeslaCard> = {
	...definition,
	component: Card,
	editor: () => import('./Editor.svelte')
};
