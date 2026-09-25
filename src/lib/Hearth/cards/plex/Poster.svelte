<script lang="ts">
	import { ICON } from '../../iconSizes';
	import { lang } from '$lib/core/i18n';
	import Icon from '../../Icon.svelte';
	import { posterOf, posterUrl, type PlexItem } from '../../plex';

	let { item, onselect }: { item: PlexItem; onselect: (item: PlexItem) => void } = $props();

	let failed = $state(false);
	let src = $derived(posterUrl(posterOf(item), 240, 360));

	let caption = $derived(
		item.type === 'episode'
			? `${item.grandparentTitle ?? ''} · S${item.parentIndex ?? '?'}E${item.index ?? '?'}`
			: item.type === 'season'
				? item.leafCount && `${item.leafCount} ${$lang('hearth_plex_episodes')}`
				: item.year
	);
</script>

<button type="button" class="poster pressable" onclick={() => onselect(item)}>
	<div class="art">
		{#if src && !failed}
			<img {src} alt="" loading="lazy" onerror={() => (failed = true)} />
		{:else}
			<Icon
				name={item.type === 'movie' ? 'movie' : 'tv'}
				size={ICON.hero}
				color="var(--h-icon-dim)"
			/>
		{/if}
	</div>
	<span class="title">{item.title}</span>
	{#if caption}
		<span class="caption">{caption}</span>
	{/if}
</button>

<style>
	.poster {
		display: flex;
		flex-direction: column;
		gap: 4px;
		width: 100%;
		min-width: 0;
		padding: 0;
		border: 0;
		background: none;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	/* the box takes its size from the slot; the image is laid over it, so a
	   large poster from Plex can never size the box instead */
	.art {
		position: relative;
		display: grid;
		place-items: center;
		width: 100%;
		aspect-ratio: 2 / 3;
		border-radius: var(--h-radius-xs);
		overflow: hidden;
		background: rgb(var(--h-surface-rgb) / calc(0.06 * var(--h-fill-scale)));
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.06 * var(--h-line-scale)));
	}

	img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.title,
	.caption {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.title {
		font-size: var(--h-type-secondary);
		color: var(--h-text-2);
	}

	.caption {
		font-size: var(--h-type-small);
		color: var(--h-text-5);
	}
</style>
