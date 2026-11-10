import * as v from 'valibot';
import type { OverviewCard } from '../../types';
import { trimmedOrUndefined } from '../../normalizers';
import type { CardDefinition } from '../types';
import { EntityIdSchema, OptionalText } from '../../schema';

export type TimerCard = Extract<OverviewCard, { type: 'timer' }>;

/** Offered on a new card until the durations are edited. */
export const DEFAULT_TIMER_DURATIONS = [30, 60, 120];

/** Whole positive minutes, in the given order, without repeats. */
export function normalizeDurations(value: unknown): number[] {
	if (!Array.isArray(value)) return [...DEFAULT_TIMER_DURATIONS];
	const minutes = value
		.map((item) => (typeof item === 'string' ? Number(item.trim()) : item))
		.filter((item): item is number => typeof item === 'number' && Number.isFinite(item))
		.map((item) => Math.round(item))
		.filter((item) => item > 0);
	return [...new Set(minutes)];
}

/** The `HH:MM:SS` duration timer.start takes. */
export function timerDuration(minutes: number): string {
	const pad = (value: number) => String(value).padStart(2, '0');
	return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}:00`;
}

/** Minutes in a Home Assistant duration attribute such as `1:00:00` or `0:40:00`. */
export function durationMinutes(duration: unknown): number | null {
	if (typeof duration !== 'string') return null;
	const parts = duration.split(':').map(Number);
	if (parts.some((part) => !Number.isFinite(part))) return null;
	while (parts.length < 3) parts.unshift(0);
	return parts[0] * 60 + parts[1] + parts[2] / 60;
}

export const timerCard: CardDefinition<TimerCard> = {
	type: 'timer',
	label: 'hearth_card_timer_label',
	name: 'hearth_card_timer_name',
	sub: 'hearth_card_timer_sub',
	icon: 'timer',
	normalize: (card) => ({
		// the presets call timer.start; any other domain has no duration to set
		entity: /^timer\..+/.test(trimmedOrUndefined(card.entity) ?? '')
			? trimmedOrUndefined(card.entity)
			: undefined,
		title: trimmedOrUndefined(card.title),
		icon: trimmedOrUndefined(card.icon),
		durations: normalizeDurations(card.durations)
	}),
	schema: v.looseObject({
		entity: v.optional(v.pipe(EntityIdSchema, v.regex(/^timer\..+/, 'must be a timer'))),
		title: OptionalText,
		icon: OptionalText,
		durations: v.optional(
			v.array(
				v.pipe(
					v.number('must be a number of minutes'),
					v.integer('must be whole minutes'),
					v.minValue(1, 'must be at least 1 minute')
				),
				'must be a list of minutes'
			)
		)
	}),
	needsConfiguration: (card) => !card.entity || card.durations.length === 0,
	entityIds: (card) => (card.entity ? [card.entity] : [])
};
