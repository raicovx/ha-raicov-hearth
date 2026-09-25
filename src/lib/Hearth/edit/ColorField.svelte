<script lang="ts">
	import { slide } from 'svelte/transition';
	import { motion } from '$lib/core/app/motion';
	import { MOTION } from '$lib/core/theme';
	import { lang } from '$lib/core/i18n';
	import { ICON } from '../iconSizes';
	import Icon from '../Icon.svelte';
	import ColorPicker from './ColorPicker.svelte';

	let {
		label,
		value,
		placeholder = '',
		onchange,
		onclear = undefined
	}: {
		label: string;
		value: string;
		/** Shown in place of an empty value, e.g. what the theme falls back to. */
		placeholder?: string;
		onchange: (value: string) => void;
		/** Offers a clear button while a value is set. */
		onclear?: () => void;
	} = $props();

	let open = $state(false);
</script>

<div class="field" class:open>
	<div class="header">
		<button type="button" class="summary" aria-expanded={open} onclick={() => (open = !open)}>
			<span class="chip" class:empty={!value} style:background={value || undefined}></span>
			<span class="field-label">{label}</span>
			<span class="value">{value || placeholder}</span>
		</button>
		{#if onclear && value}
			<button
				type="button"
				class="clear"
				aria-label={`${$lang('clear')} ${label}`}
				onclick={() => {
					open = false;
					onclear();
				}}
			>
				<Icon name="close" size={ICON.control} />
			</button>
		{/if}
	</div>

	{#if open}
		<div transition:slide={{ duration: $motion ? MOTION.base : 0 }}>
			<ColorPicker {value} {onchange} />
		</div>
	{/if}
</div>

<style>
	.field {
		min-width: 0;
		padding: 8px 10px;
		border-radius: var(--h-radius-xs);
		background: var(--h-inset);
		border: 1px solid transparent;
	}

	/* the picker needs the whole row of the grid the fields are laid out in */
	.field.open {
		grid-column: 1 / -1;
		border-color: rgb(var(--h-line-rgb) / calc(0.12 * var(--h-line-scale)));
	}

	.header {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.summary {
		display: flex;
		align-items: center;
		gap: 10px;
		flex: 1;
		min-width: 0;
		padding: 0;
		border: 0;
		background: none;
		font: inherit;
		cursor: pointer;
		text-align: left;
	}

	.chip {
		flex: none;
		width: 30px;
		height: 30px;
		border-radius: var(--h-radius-tight);
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.15 * var(--h-line-scale)));
	}

	.chip.empty {
		border-style: dashed;
	}

	.clear {
		display: flex;
		flex: none;
		padding: 4px;
		border: 0;
		background: none;
		color: var(--h-icon);
		cursor: pointer;
	}

	.clear:hover {
		color: var(--h-text-3);
	}

	.field-label {
		flex: 1;
		min-width: 0;
		font-size: var(--h-type-secondary);
		color: var(--h-text-3);
	}

	.value {
		flex: none;
		font-family: var(--h-font-mono);
		font-size: var(--h-type-label);
		letter-spacing: 1px;
		color: var(--h-text-5);
	}
</style>
