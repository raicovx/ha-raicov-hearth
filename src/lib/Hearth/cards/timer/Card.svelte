<script lang="ts">
	import { ICON } from '../../iconSizes';
	import Ripple from '$lib/ui/actions/ripple';
	import { lang, fill } from '$lib/core/i18n';
	import { timer } from '$lib/core/app/clock';
	import { entityAvailable, states } from '$lib/core/ha/entities';
	import { callEntityService, pendingEntities } from '$lib/core/ha/commands';
	import { PRESS_RIPPLE } from '../../config';
	import { hearthEditMode } from '../../store';
	import Icon from '../../Icon.svelte';
	import { durationMinutes, timerDuration } from '../../model/cards/timer';
	import type { TimerCard } from './descriptor';

	let { card }: { card: TimerCard } = $props();

	let entity = $derived(card.entity ?? '');
	let stateObj = $derived($states?.[entity]);
	let timerState = $derived(stateObj?.state);
	let available = $derived(entityAvailable(stateObj));
	let running = $derived(available && (timerState === 'active' || timerState === 'paused'));
	let label = $derived(card.title || stateObj?.attributes?.friendly_name || entity);
	// timer.start with a duration also sets the duration attribute, so it names the running preset
	let runningMinutes = $derived(running ? durationMinutes(stateObj?.attributes?.duration) : null);
	let pending = $derived($pendingEntities[entity] !== undefined);

	function clock(totalSeconds: number) {
		const h = Math.floor(totalSeconds / 3600);
		const m = Math.floor((totalSeconds % 3600) / 60);
		const s = totalSeconds % 60;
		return h
			? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
			: `${m}:${String(s).padStart(2, '0')}`;
	}

	// finishes_at is authoritative while running; paused timers report remaining
	let status = $derived.by(() => {
		if (!entity || card.durations.length === 0) return $lang('hearth_timer_card_empty');
		if (!available) return '-';
		if (timerState === 'active' && stateObj?.attributes?.finishes_at) {
			const ms = Date.parse(stateObj.attributes.finishes_at) - $timer.getTime();
			return clock(Math.max(0, Math.round(ms / 1000)));
		}
		if (timerState === 'paused') {
			const minutes = durationMinutes(stateObj?.attributes?.remaining);
			const remaining = minutes === null ? '' : clock(Math.round(minutes * 60));
			return `${remaining} ${$lang('paused').toLowerCase()}`.trim();
		}
		return $lang('hearth_timer_off');
	});

	function presetLabel(minutes: number) {
		const h = Math.floor(minutes / 60);
		const m = minutes % 60;
		if (!h) return fill($lang('hearth_duration_minutes'), { count: m });
		if (!m) return fill($lang('hearth_duration_hours'), { count: h });
		return fill($lang('hearth_duration_hours_minutes'), { hours: h, minutes: m });
	}

	function start(minutes: number) {
		if ($hearthEditMode || !entity || !available) return;
		callEntityService('timer', 'start', entity, { duration: timerDuration(minutes) });
	}

	function cancel() {
		if ($hearthEditMode || !entity || !available) return;
		callEntityService('timer', 'cancel', entity);
	}
</script>

<div class="row" class:unavailable={entity && !available}>
	<Icon
		name={card.icon || 'timer'}
		size={ICON.tile}
		color={running ? 'var(--h-accent-icon)' : 'var(--h-accent-dim-text)'}
		fill={running}
	/>
	<div class="info">
		<div class="name">{label || $lang('hearth_card_timer_name')}</div>
		<div class="status" class:running>{status}</div>
	</div>
	{#if entity && card.durations.length > 0}
		<div class="actions">
			{#each card.durations as minutes (minutes)}
				{@const active = runningMinutes !== null && Math.abs(runningMinutes - minutes) < 0.5}
				<button
					type="button"
					class="action pressable"
					class:active
					class:pending
					aria-disabled={!available}
					aria-pressed={active}
					aria-label={fill($lang('hearth_start_timer_for'), { duration: presetLabel(minutes) })}
					use:Ripple={PRESS_RIPPLE}
					onclick={() => start(minutes)}
				>
					{presetLabel(minutes)}
				</button>
			{/each}
			{#if running}
				<button
					type="button"
					class="action cancel pressable"
					aria-label={$lang('hearth_cancel')}
					use:Ripple={PRESS_RIPPLE}
					onclick={cancel}
				>
					<Icon name="close" size={ICON.control} />
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	/* one row like the Tesla and vacuum cards; the buttons wrap under the name
	   when the card is too narrow for both */
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px 14px;
		padding: var(--h-card-padding);
		border-radius: var(--h-radius-card);
		background: rgb(var(--h-surface-rgb) / calc(0.05 * var(--h-fill-scale)));
		backdrop-filter: var(--h-surface-blur);
		box-shadow: var(--h-card-shadow);
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.07 * var(--h-line-scale)));
	}

	.row.unavailable {
		opacity: 0.5;
	}

	.info {
		flex: 1 1 120px;
		min-width: 0;
	}

	.name {
		overflow: hidden;
		font-size: var(--h-type-emphasis);
		font-weight: 600;
		color: var(--h-text-2);
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.status {
		overflow: hidden;
		font-size: var(--h-type-secondary);
		font-variant-numeric: tabular-nums;
		color: var(--h-text-5);
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.status.running {
		color: var(--h-accent-text);
	}

	.actions {
		display: flex;
		flex: none;
		gap: 8px;
		margin-left: auto;
	}

	.action {
		display: grid;
		place-items: center;
		position: relative;
		overflow: hidden;
		min-width: 44px;
		min-height: 40px;
		padding: 0 14px;
		border: 0;
		border-radius: var(--h-radius-xs);
		background: rgb(var(--h-surface-rgb) / calc(0.08 * var(--h-fill-scale)));
		color: var(--h-text-3);
		font: inherit;
		font-size: var(--h-type-body);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
		cursor: pointer;
	}

	.action[aria-disabled='true'] {
		cursor: default;
	}

	.action.active {
		background: rgb(var(--h-accent-rgb) / calc(0.16 * var(--h-accent-scale)));
		color: var(--h-accent-text);
	}

	.action.cancel {
		padding: 0;
		border-radius: var(--h-radius-pill);
		color: var(--h-text-2);
	}
</style>
