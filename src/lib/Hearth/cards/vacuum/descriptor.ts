import type { CardDescriptor } from '../types';
import { vacuumCard as definition, type VacuumCard } from '../../model/cards/vacuum';
export type { VacuumCard } from '../../model/cards/vacuum';

export const vacuumCard: CardDescriptor<VacuumCard> = {
	...definition,
	load: () => import('./Card.svelte'),
	editor: () => import('./Editor.svelte')
};
