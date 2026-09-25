import * as v from 'valibot';
import { OptionalEntityId, OptionalText } from '../../schema';
import type { OverviewCard } from '../../types';
import { trimmedOrUndefined } from '../../normalizers';
import type { CardDefinition } from '../types';

export type TeslaCard = Extract<OverviewCard, { type: 'tesla' }>;

/** The tyre fields in reading order: front row, then rear, left before right. */
export const TESLA_TIRE_FIELDS = [
	'tire_front_left_entity',
	'tire_front_right_entity',
	'tire_rear_left_entity',
	'tire_rear_right_entity'
] as const;

const ENTITY_FIELDS = [
	'battery_entity',
	'last_charge_entity',
	...TESLA_TIRE_FIELDS,
	'climate_entity'
] as const;

export const teslaCard: CardDefinition<TeslaCard> = {
	type: 'tesla',
	label: 'hearth_card_tesla_label',
	name: 'hearth_card_tesla_name',
	sub: 'hearth_card_tesla_sub',
	previewInteractive: true,
	icon: 'directions_car',
	normalize: (card) => ({
		title: trimmedOrUndefined(card.title),
		...Object.fromEntries(ENTITY_FIELDS.map((field) => [field, trimmedOrUndefined(card[field])]))
	}),
	schema: v.looseObject({
		title: OptionalText,
		battery_entity: OptionalEntityId,
		last_charge_entity: OptionalEntityId,
		tire_front_left_entity: OptionalEntityId,
		tire_front_right_entity: OptionalEntityId,
		tire_rear_left_entity: OptionalEntityId,
		tire_rear_right_entity: OptionalEntityId,
		climate_entity: OptionalEntityId
	}),
	needsConfiguration: (card) => ENTITY_FIELDS.every((field) => !card[field]),
	entityIds: (card) =>
		ENTITY_FIELDS.map((field) => card[field]).filter((id): id is string => Boolean(id))
};
