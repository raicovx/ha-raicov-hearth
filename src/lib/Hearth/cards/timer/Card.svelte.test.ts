import { fireEvent, render } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { states } from '$lib/core/ha/entities';
import { hassEntity } from '$lib/core/ha/testing';
import * as commands from '$lib/core/ha/commands';
import {
	durationMinutes,
	normalizeDurations,
	timerCard as definition,
	timerDuration
} from '../../model/cards/timer';
import Card from './Card.svelte';
import type { TimerCard } from './descriptor';

describe('timer card definition', () => {
	it('keeps whole positive minutes in order without repeats', () => {
		expect(normalizeDurations([40, '60', 120, 40, 0, -5, 'x', 1.6])).toEqual([40, 60, 120, 2]);
	});

	it('offers default durations when none are configured', () => {
		expect(definition.normalize({ type: 'timer' }).durations).toEqual([30, 60, 120]);
	});

	it('only accepts a timer entity', () => {
		expect(definition.normalize({ entity: 'timer.sleep' }).entity).toBe('timer.sleep');
		expect(definition.normalize({ entity: 'switch.ac' }).entity).toBeUndefined();
	});

	it('converts between minutes and Home Assistant durations', () => {
		expect(timerDuration(40)).toBe('00:40:00');
		expect(timerDuration(120)).toBe('02:00:00');
		expect(timerDuration(90)).toBe('01:30:00');
		expect(durationMinutes('1:00:00')).toBe(60);
		expect(durationMinutes('0:40:00')).toBe(40);
		expect(durationMinutes(undefined)).toBeNull();
	});
});

describe('timer card', () => {
	const card: TimerCard = {
		id: 'sleep',
		type: 'timer',
		entity: 'timer.sleep',
		title: 'Sleep timer',
		durations: [40, 60, 120]
	};

	afterEach(() => vi.restoreAllMocks());

	it('starts the timer with the chosen duration', async () => {
		states.set({ 'timer.sleep': hassEntity('timer.sleep', 'idle', { duration: '0:30:00' }) });
		const call = vi.spyOn(commands, 'callEntityService').mockImplementation(() => undefined);
		const { getByRole, getByText } = render(Card, { card });

		expect(getByText('40m')).toBeTruthy();
		expect(getByText('2h')).toBeTruthy();
		await fireEvent.click(getByRole('button', { name: 'Start for 1h' }));
		expect(call).toHaveBeenCalledWith('timer', 'start', 'timer.sleep', { duration: '01:00:00' });
	});

	it('marks the running preset and offers cancel', async () => {
		states.set({
			'timer.sleep': hassEntity('timer.sleep', 'active', {
				duration: '0:40:00',
				finishes_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
			})
		});
		const call = vi.spyOn(commands, 'callEntityService').mockImplementation(() => undefined);
		const { getByRole } = render(Card, { card });

		expect(getByRole('button', { name: 'Start for 40m' }).getAttribute('aria-pressed')).toBe(
			'true'
		);
		expect(getByRole('button', { name: 'Start for 1h' }).getAttribute('aria-pressed')).toBe(
			'false'
		);
		await fireEvent.click(getByRole('button', { name: 'Cancel' }));
		expect(call).toHaveBeenCalledWith('timer', 'cancel', 'timer.sleep');
	});
});
