import * as v from 'valibot';
import type { OverviewCard } from '../../types';
import { normalizeVerdict, trimmedOrUndefined } from '../../normalizers';
import type { CardDefinition } from '../types';
import {
	OptionalText,
	OptionalEntityId,
	OptionalEntityIdList,
	VerdictBandsSchema
} from '../../schema';

export type TemperatureCard = Extract<OverviewCard, { type: 'temperature' }>;

export const temperatureCard: CardDefinition<TemperatureCard> = {
	type: 'temperature',
	label: 'hearth_card_temperature_label',
	name: 'hearth_card_temperature_name',
	sub: 'hearth_card_temperature_sub',
	icon: 'monitoring',
	fillByDefault: true,
	sizable: true,
	stretchMinHeight: 110,
	normalize: (card) => ({
		entities: normalizeEntityIds(card.entities),
		climate_entity: trimmedOrUndefined(card.climate_entity),
		verdict: normalizeVerdict(card.verdict)
	}),
	schema: v.looseObject({
		label: OptionalText,
		entity: OptionalEntityId,
		entities: OptionalEntityIdList,
		unit: OptionalText,
		climate_entity: OptionalEntityId,
		verdict: v.optional(v.union([v.literal(false), VerdictBandsSchema], 'must be false or bands'))
	}),
	needsConfiguration: (card) => !card.entity,
	entityIds: (card) => [
		...temperatureSensors(card),
		...(card.climate_entity ? [card.climate_entity] : [])
	]
};

/** Every sensor the card averages: entity first, then the extra ones, without repeats. */
export function temperatureSensors(card: Pick<TemperatureCard, 'entity' | 'entities'>): string[] {
	return [...new Set([card.entity, ...(card.entities ?? [])].filter((id): id is string => !!id))];
}

function normalizeEntityIds(raw: unknown): string[] | undefined {
	if (!Array.isArray(raw)) return undefined;
	const ids = raw.map((entry) => (typeof entry === 'string' ? entry.trim() : '')).filter(Boolean);
	return ids.length ? ids : undefined;
}
