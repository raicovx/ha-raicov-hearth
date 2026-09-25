import * as v from 'valibot';
import type { OverviewCard } from '../../types';
import { trimmedOrUndefined } from '../../normalizers';
import type { CardDefinition } from '../types';
import { OptionalText } from '../../schema';

export type TemplateCard = Extract<OverviewCard, { type: 'template' }>;

export const templateCard: CardDefinition<TemplateCard> = {
	type: 'template',
	label: 'hearth_card_template_label',
	name: 'hearth_card_template_name',
	sub: 'hearth_card_template_sub',
	icon: 'notes',
	normalize: (card) => ({
		// kept verbatim: leading whitespace can be Markdown structure
		template: typeof card.template === 'string' && card.template.trim() ? card.template : undefined,
		title: trimmedOrUndefined(card.title),
		icon: trimmedOrUndefined(card.icon)
	}),
	schema: v.looseObject({ template: OptionalText, title: OptionalText, icon: OptionalText }),
	needsConfiguration: (card) => !card.template,
	entityIds: () => []
};
