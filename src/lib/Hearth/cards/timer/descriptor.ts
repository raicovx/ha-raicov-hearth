import type { CardDescriptor } from '../types';
import Card from './Card.svelte';
import { timerCard as definition, type TimerCard } from '../../model/cards/timer';
export type { TimerCard } from '../../model/cards/timer';

export const timerCard: CardDescriptor<TimerCard> = {
	...definition,
	component: Card,
	editor: () => import('./Editor.svelte')
};
