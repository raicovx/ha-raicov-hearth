<script lang="ts">
	import { ICON } from '../../iconSizes';
	import Ripple from '$lib/ui/actions/ripple';
	import { lang, fill } from '$lib/core/i18n';
	import { timer } from '$lib/core/app/clock';
	import { entityAvailable, states } from '$lib/core/ha/entities';
	import { callEntityService, pendingEntities } from '$lib/core/ha/commands';
	import { PRESS_RIPPLE } from '../../config';
	import { hearthEditMode } from '../../store';
	import EmptyState from '../../EmptyState.svelte';
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

<div class="card" class:unavailable={entity && !available}>
	<div class="head">
		<Icon
			name={card.icon || 'timer'}
			size={ICON.tile}
			color={running ? 'var(--h-accent-icon)' : undefined}
			fill={running}
		/>
		<div class="text">
			<div class="name">{label || $lang('hearth_card_timer_name')}</div>
			<div class="status" class:running>{status}</div>
		</div>
		{#if running}
			<button
				type="button"
				class="cancel pressable"
				aria-label={$lang('hearth_cancel')}
				use:Ripple={PRESS_RIPPLE}
				onclick={cancel}
			>
				<Icon name="close" size={ICON.control} />
			</button>
		{/if}
	</div>
	{#if !entity || card.durations.length === 0}
		<EmptyState text={$lang('hearth_timer_card_empty')} />
	{:else}
		<div class="presets">
			{#each card.durations as minutes (minutes)}
				{@const active = runningMinutes !== null && Math.abs(runningMinutes - minutes) < 0.5}
				<button
					type="button"
					class="preset pressable"
					class:active
					class:pending={$pendingEntities[entity] !== undefined}
					aria-disabled={!available}
					aria-pressed={active}
					aria-label={fill($lang('hearth_start_timer_for'), { duration: presetLabel(minutes) })}
					use:Ripple={PRESS_RIPPLE}
					onclick={() => start(minutes)}
				>
					{presetLabel(minutes)}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: 14px;
		padding: var(--h-card-padding);
		border-radius: var(--h-radius-card);
		background: rgb(var(--h-surface-rgb) / calc(0.045 * var(--h-fill-scale)));
		backdrop-filter: var(--h-surface-blur);
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.06 * var(--h-line-scale)));
		box-shadow: var(--h-card-shadow);
	}

	.card.unavailable {
		opacity: 0.5;
	}

	.head {
		display: flex;
		align-items: center;
		gap: 14px;
	}

	.text {
		flex: 1;
		min-width: 0;
	}

	.name {
		font-size: var(--h-type-body);
		color: var(--h-text-3);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.status {
		font-size: var(--h-type-headline);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: var(--h-text-4);
	}

	.status.running {
		color: var(--h-text-1);
	}

	.cancel {
		display: grid;
		place-items: center;
		position: relative;
		overflow: hidden;
		width: 44px;
		height: 44px;
		border: 0;
		border-radius: 50%;
		background: rgb(var(--h-surface-rgb) / calc(0.08 * var(--h-fill-scale)));
		color: var(--h-text-2);
		cursor: pointer;
	}

	.presets {
		display: flex;
		gap: 10px;
	}

	.preset {
		flex: 1 1 0;
		min-width: 0;
		position: relative;
		overflow: hidden;
		padding: 12px 10px;
		border-radius: var(--h-radius-xs);
		background: rgb(var(--h-surface-rgb) / calc(0.06 * var(--h-fill-scale)));
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.08 * var(--h-line-scale)));
		color: var(--h-text-3);
		font: inherit;
		font-size: var(--h-type-body);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
	}

	.preset[aria-disabled='true'] {
		cursor: default;
	}

	.preset.active {
		background: rgb(var(--h-accent-rgb) / calc(0.13 * var(--h-accent-scale)));
		border-color: rgb(var(--h-accent-rgb) / calc(0.34 * var(--h-accent-scale)));
		color: var(--h-text-1);
	}
</style>
