<script lang="ts">
	import { ICON } from '../../iconSizes';
	import { lang } from '$lib/core/i18n';
	import { renderedTemplate } from '../../renderedTemplate';
	import { hearthEditMode } from '../../store';
	import TemplateBlock from '../../TemplateBlock.svelte';
	import type { TemplateWidget } from './descriptor';

	let { widget }: { widget: TemplateWidget } = $props();

	let rendered = $derived(renderedTemplate(widget.template));
	let html = $derived($rendered.html);
	let error = $derived($rendered.error);
</script>

<!-- a template that renders nothing hides the widget; the editor keeps it findable, dimmed -->
{#if error || html.trim() || $hearthEditMode}
	<div class="template">
		{#if error || html.trim()}
			<TemplateBlock
				{html}
				{error}
				icon={widget.icon}
				iconSize={ICON.control}
				title={widget.title}
			/>
		{:else}
			<div class="inactive">{widget.title || $lang('hearth_widget_template_name')}</div>
		{/if}
	</div>
{/if}

<style>
	/* the same surface as the status and progress rows around it */
	.template {
		padding: 14px 16px;
		margin-bottom: 8px;
		border-radius: var(--h-radius-sm);
		background: rgb(var(--h-surface-rgb) / calc(0.045 * var(--h-fill-scale)));
		backdrop-filter: var(--h-surface-blur);
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.07 * var(--h-line-scale)));
		box-shadow: var(--h-card-shadow);
	}

	.inactive {
		opacity: 0.45;
		font-size: var(--h-type-body);
		color: var(--h-text-3);
	}
</style>
