import type { CardDescriptor } from '../types';
import { templateCard as definition, type TemplateCard } from '../../model/cards/template';
export type { TemplateCard } from '../../model/cards/template';

export const templateCard: CardDescriptor<TemplateCard> = {
	...definition,
	load: () => import('./Card.svelte'),
	editor: () => import('./Editor.svelte')
};
