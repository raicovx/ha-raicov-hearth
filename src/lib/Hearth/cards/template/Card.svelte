<script lang="ts">
	import { ICON } from '../../iconSizes';
	import { renderedTemplate } from '../../renderedTemplate';
	import TemplateBlock from '../../TemplateBlock.svelte';
	import type { TemplateCard } from './descriptor';

	let { card }: { card: TemplateCard } = $props();

	let rendered = $derived(renderedTemplate(card.template));
</script>

<div class="card">
	<TemplateBlock
		html={$rendered.html}
		error={$rendered.error}
		icon={card.icon || 'notes'}
		iconSize={ICON.tile}
		title={card.title}
	/>
</div>

<style>
	.card {
		padding: var(--h-card-padding);
		border-radius: var(--h-radius-card);
		background: rgb(var(--h-surface-rgb) / calc(0.045 * var(--h-fill-scale)));
		backdrop-filter: var(--h-surface-blur);
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.06 * var(--h-line-scale)));
		box-shadow: var(--h-card-shadow);
	}
</style>
