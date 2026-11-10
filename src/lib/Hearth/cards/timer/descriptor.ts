import type { CardDescriptor } from '../types';
import { timerCard as definition, type TimerCard } from '../../model/cards/timer';
export type { TimerCard } from '../../model/cards/timer';

export const timerCard: CardDescriptor<TimerCard> = {
	...definition,
	load: () => import('./Card.svelte'),
	editor: () => import('./Editor.svelte')
};
