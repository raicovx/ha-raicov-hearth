<script lang="ts">
	import { lang, selectedLanguage } from '$lib/core/i18n';
	import { ICON } from '../../iconSizes';
	import Ripple from '$lib/ui/actions/ripple';
	import { entityActiveFor, states } from '$lib/core/ha/entities';
	import { PRESS_RIPPLE } from '../../config';
	import { hearthEditMode } from '../../store';
	import { controlOverrides, pendingEntities } from '$lib/core/ha/commands';
	import { setClimatePower } from '$lib/core/domains/climate';
	import AnchoredPopover from '../../AnchoredPopover.svelte';
	import Icon from '../../Icon.svelte';
	import { getHearthInteractionMode } from '../../interaction';
	import TeslaPopover from '../../TeslaPopover.svelte';
	import { carBattery, carReading } from '../../tesla';
	import type { TeslaCard } from './descriptor';

	let { card }: { card: TeslaCard } = $props();

	const interactionMode = getHearthInteractionMode();
	const preview = interactionMode === 'preview';

	let battery = $derived(card.battery_entity ? carBattery($states?.[card.battery_entity]) : null);
	let lastCharge = $derived(
		card.last_charge_entity
			? carReading($states?.[card.last_charge_entity], $selectedLanguage)
			: null
	);
	let climate = $derived(card.climate_entity ? $states?.[card.climate_entity] : undefined);
	let climateOn = $derived(
		card.climate_entity ? entityActiveFor(card.climate_entity, climate, $controlOverrides) : false
	);
	let pending = $derived(
		card.climate_entity !== undefined && $pendingEntities[card.climate_entity] !== undefined
	);
	let status = $derived(
		[
			...(battery !== null ? [`${battery}%`] : []),
			...(lastCharge ? [`${$lang('hearth_tesla_charged')} ${lastCharge}`] : []),
			...(climateOn ? [$lang('hearth_tesla_climate_on')] : [])
		].join(' · ') || $lang('unavailable')
	);
	let climateLabel = $derived(
		$lang(climateOn ? 'hearth_tesla_stop_climate' : 'hearth_tesla_start_climate')
	);
	let row = $state<HTMLElement | undefined>();
	let popoverOpen = $state(false);

	function openPopup() {
		if ($hearthEditMode && !preview) return;
		popoverOpen = !popoverOpen;
	}

	$effect(() => {
		if ($hearthEditMode && !preview) popoverOpen = false;
	});
</script>

<div class="fit">
	<div
		class="row"
		class:openable={!$hearthEditMode || preview}
		class:open={popoverOpen}
		bind:this={row}
		role="button"
		tabindex="0"
		aria-expanded={popoverOpen}
		onclick={openPopup}
		onkeydown={(event) => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				openPopup();
			}
		}}
	>
		<div class="glyph">
			<Icon name="directions_car" size={ICON.tile} color="var(--h-accent-dim-text)" />
			{#if battery !== null}
				<div class="gauge" aria-hidden="true">
					<div class="level" class:low={battery <= 20} style:width="{battery}%"></div>
				</div>
			{/if}
		</div>
		<div class="info">
			<div class="name">{card.title || $lang('hearth_card_tesla_name')}</div>
			<div class="status">{status}</div>
		</div>
		{#if card.climate_entity}
			<button
				type="button"
				class="action pressable"
				class:running={climateOn}
				class:pending
				aria-label={climateLabel}
				use:Ripple={PRESS_RIPPLE}
				onclick={(event) => {
					event.stopPropagation();
					if (card.climate_entity && !preview) setClimatePower(card.climate_entity, !climateOn);
				}}
				onkeydown={(event) => event.stopPropagation()}
			>
				<Icon name={climateOn ? 'power_settings_new' : 'mode_fan'} size={ICON.control} />
				<span class="action-label">{climateLabel}</span>
			</button>
		{/if}
		<Icon name="chevron_right" size={ICON.control} color="var(--h-icon)" />
	</div>
</div>

{#if popoverOpen && row}
	<AnchoredPopover anchor={row} onclose={() => (popoverOpen = false)}>
		<TeslaPopover {card} />
	</AnchoredPopover>
{/if}

<style>
	/* the card's own width, not the screen's, decides how much the button shows */
	.fit {
		container-type: inline-size;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: var(--h-card-padding);
		border-radius: var(--h-radius-card);
		background: rgb(var(--h-surface-rgb) / calc(0.05 * var(--h-fill-scale)));
		backdrop-filter: var(--h-surface-blur);
		box-shadow: var(--h-card-shadow);
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.07 * var(--h-line-scale)));
	}

	.row.openable {
		cursor: pointer;
	}

	.row.open {
		border-color: rgb(var(--h-accent-rgb) / calc(0.28 * var(--h-accent-scale)));
		background: rgb(var(--h-accent-rgb) / calc(0.08 * var(--h-accent-scale)));
	}

	.glyph {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}

	.gauge {
		width: 100%;
		height: 4px;
		overflow: hidden;
		border-radius: var(--h-radius-pill);
		background: rgb(var(--h-surface-rgb) / calc(0.12 * var(--h-fill-scale)));
	}

	.level {
		height: 100%;
		background: var(--h-good);
	}

	.level.low {
		background: var(--h-bad-text);
	}

	.info {
		flex: 1;
		min-width: 0;
	}

	.name {
		font-size: var(--h-type-emphasis);
		font-weight: 600;
		color: var(--h-text-2);
	}

	.status {
		overflow: hidden;
		font-size: var(--h-type-secondary);
		color: var(--h-text-5);
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.action {
		display: flex;
		flex: none;
		align-items: center;
		gap: 8px;
		border: 0;
		font: inherit;
		padding: 10px 16px;
		border-radius: var(--h-radius-xs);
		cursor: pointer;
		font-size: var(--h-type-body);
		font-weight: 600;
		background: rgb(var(--h-accent-rgb) / calc(0.16 * var(--h-accent-scale)));
		color: var(--h-accent-text);
	}

	.action.running {
		background: rgb(var(--h-bad-rgb) / calc(0.16 * var(--h-accent-scale)));
		color: var(--h-bad-text);
	}

	/* too narrow for the label: a round icon button, leaving room for the status */
	@container (max-width: 380px) {
		.row {
			gap: 10px;
		}

		.action {
			padding: 10px;
			border-radius: var(--h-radius-pill);
		}

		.action-label {
			display: none;
		}
	}
</style>
