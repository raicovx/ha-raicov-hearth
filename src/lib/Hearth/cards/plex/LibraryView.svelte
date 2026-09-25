<script lang="ts">
	import { onMount } from 'svelte';
	import { lang } from '$lib/core/i18n';
	import Poster from './Poster.svelte';
	import { fetchSectionPage, type PlexItem, type PlexSection } from '../../plex';

	let { section, onopen }: { section: PlexSection; onopen: (item: PlexItem) => void } = $props();

	const PAGE = 60;

	let items = $state<PlexItem[]>([]);
	let total = $state<number | null>(null);
	let loading = $state(false);
	let failed = $state(false);

	async function more() {
		if (loading) return;
		loading = true;
		failed = false;
		try {
			const page = await fetchSectionPage(section, items.length, PAGE);
			items = [...items, ...page.items];
			total = page.total;
		} catch {
			failed = true;
		} finally {
			loading = false;
		}
	}

	// the popup remounts this view per library, so one first page is enough here
	onMount(() => void more());
</script>

{#if failed && !items.length}
	<div class="note">{$lang('hearth_plex_unreachable')}</div>
{:else if total === null}
	<div class="note">{$lang('hearth_loading')}</div>
{:else if !items.length}
	<div class="note">{$lang('hearth_plex_nothing_found')}</div>
{:else}
	<div class="grid">
		{#each items as item (item.ratingKey)}
			<Poster {item} onselect={onopen} />
		{/each}
	</div>
	{#if items.length < total}
		<button type="button" class="hearth-button secondary more" disabled={loading} onclick={more}>
			{loading ? $lang('hearth_loading') : $lang('hearth_plex_show_more')}
		</button>
	{/if}
{/if}

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
		gap: 14px 12px;
	}

	.more {
		align-self: center;
	}

	.note {
		font-size: var(--h-type-secondary);
		color: var(--h-text-5);
	}
</style>
