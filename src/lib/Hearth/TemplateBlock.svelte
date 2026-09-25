<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import Icon from './Icon.svelte';

	/*
	 * A rendered template beside an optional icon, under an optional title:
	 * the inside of the template card and the sidebar template widget, which
	 * each draw their own surface around it. List items read as rows.
	 */
	let {
		html,
		error,
		icon,
		iconSize,
		title
	}: {
		html: string;
		error: string | null;
		icon?: string;
		iconSize: number;
		title?: string;
	} = $props();
</script>

<div class="block">
	{#if icon}
		<div class="icon">
			<Icon name={icon} size={iconSize} color="var(--h-accent-icon)" />
		</div>
	{/if}
	<div class="body">
		{#if title}
			<div class="title">{title}</div>
		{/if}
		{#if error}
			<div class="error">{$lang('hearth_template_error')}: {error}</div>
		{:else if html.trim()}
			<div class="content">
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- sanitized in markdown.ts -->
				{@html html}
			</div>
		{/if}
	</div>
</div>

<style>
	.block {
		display: flex;
		align-items: flex-start;
		gap: 14px;
	}

	.icon {
		display: flex;
		flex: none;
	}

	.body {
		flex: 1;
		min-width: 0;
	}

	.title {
		font-size: var(--h-type-title);
		font-weight: 600;
		color: var(--h-text-2);
		margin-bottom: 8px;
	}

	.content {
		font-size: var(--h-type-body);
		color: var(--h-text-3);
		overflow-wrap: anywhere;
	}

	.content :global(:is(p, ul, ol, h1, h2, h3, h4)) {
		margin: 0;
	}

	.content :global(:is(p, ul, ol) + :is(p, ul, ol)) {
		margin-top: 8px;
	}

	.content :global(:is(h1, h2, h3, h4)) {
		font-size: var(--h-type-title);
		font-weight: 600;
		color: var(--h-text-2);
		margin-bottom: 8px;
	}

	/* list items read as rows, like the entries of the other cards */
	.content :global(ul) {
		list-style: none;
		padding: 0;
	}

	.content :global(ol) {
		padding-left: 20px;
	}

	.content :global(li) {
		padding: 8px 0;
	}

	.content :global(ul > li + li) {
		border-top: 1px solid rgb(var(--h-line-rgb) / calc(0.07 * var(--h-line-scale)));
	}

	.content :global(ul > li:first-child) {
		padding-top: 2px;
	}

	.content :global(ul > li:last-child) {
		padding-bottom: 0;
	}

	.content :global(strong) {
		font-weight: 600;
		color: var(--h-text-1);
	}

	.content :global(em) {
		color: var(--h-text-5);
	}

	.content :global(a) {
		color: var(--h-accent-text);
	}

	.error {
		font-size: var(--h-type-small);
		color: var(--h-bad-text);
	}
</style>
