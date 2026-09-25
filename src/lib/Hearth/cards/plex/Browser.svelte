<script lang="ts">
	import { ICON } from '../../iconSizes';
	import { lang } from '$lib/core/i18n';
	import { layer } from '$lib/ui/layers';
	import CloseButton from '../../CloseButton.svelte';
	import Icon from '../../Icon.svelte';
	import ItemView from './ItemView.svelte';
	import LibraryView from './LibraryView.svelte';
	import {
		fetchPlexClients,
		fetchServerName,
		plexBrowser,
		type PlexBrowser,
		type PlexClient,
		type PlexItem
	} from '../../plex';

	/*
	 * The Plex card's library browser. It sits at the dashboard root beside
	 * the control popup, because a card's backdrop filter would clip a fixed
	 * overlay drawn inside it. Views stack: a library opens an item, a show
	 * opens a season, a season opens an episode; back pops one.
	 */

	let { browser }: { browser: PlexBrowser } = $props();

	type View = PlexBrowser['start'];

	// svelte-ignore state_referenced_locally
	let stack = $state<View[]>([browser.start]);
	let current = $derived(stack[stack.length - 1]);
	let title = $derived(current.kind === 'library' ? current.section.title : current.item.title);

	let clients = $state<PlexClient[] | null>(null);
	let serverName = $state<string>();

	$effect(() => {
		let cancelled = false;
		fetchPlexClients()
			.then((found) => !cancelled && (clients = found))
			.catch(() => !cancelled && (clients = []));
		fetchServerName()
			.then((name) => !cancelled && (serverName = name))
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	});

	function open(item: PlexItem) {
		stack.push({ kind: 'item', item });
	}

	function back() {
		if (stack.length > 1) stack.pop();
	}

	function close() {
		plexBrowser.set(null);
	}

	let pressStartedOnBackdrop = false;
</script>

<div
	class="overlay"
	role="presentation"
	onpointerdown={(event) => (pressStartedOnBackdrop = event.target === event.currentTarget)}
	onclick={(event) => event.target === event.currentTarget && pressStartedOnBackdrop && close()}
	use:layer={{
		close: () => (stack.length > 1 ? back() : close()),
		trap: true,
		initialFocus: (node) => node.querySelector<HTMLElement>('.close-button')
	}}
>
	<div class="sheet" role="dialog" aria-modal="true" aria-label={title}>
		<div class="header">
			{#if stack.length > 1}
				<button type="button" class="back" aria-label={$lang('hearth_back')} onclick={back}>
					<Icon name="arrow_back" size={ICON.control} />
				</button>
			{:else}
				<Icon name="movie" size={ICON.tile} color="var(--h-accent-text)" />
			{/if}
			<div class="title">{title}</div>
			<CloseButton onclick={close} />
		</div>
		<!-- views below the top stay mounted, so back keeps loaded pages and scroll -->
		{#each stack as view, index (index)}
			<div class="body" hidden={index !== stack.length - 1}>
				{#if view.kind === 'library'}
					<LibraryView section={view.section} onopen={open} />
				{:else}
					<ItemView
						item={view.item}
						players={browser.card.players ?? []}
						{clients}
						{serverName}
						onopen={open}
					/>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.overlay {
		position: absolute;
		inset: 0;
		z-index: var(--h-layer-popup);
		background: var(--h-overlay);
		backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16px;
	}

	.sheet {
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		width: min(760px, 100%);
		max-height: calc(100dvh - 32px);
		background: linear-gradient(180deg, var(--h-sheet-0), var(--h-sheet-1));
		border: 1px solid rgb(var(--h-accent-rgb) / calc(0.18 * var(--h-accent-scale)));
		border-radius: var(--h-radius-xl);
		padding: var(--h-modal-padding);
		box-shadow: var(--h-shadow-layer);
	}

	.header {
		display: flex;
		align-items: center;
		gap: 14px;
		margin-bottom: 16px;
	}

	.back {
		display: flex;
		padding: 4px;
		border: 0;
		background: none;
		color: var(--h-icon);
		cursor: pointer;
	}

	.title {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: var(--h-type-title);
		font-weight: 600;
		color: var(--h-text-1);
	}

	.body[hidden] {
		display: none;
	}

	.body {
		display: flex;
		flex-direction: column;
		gap: 18px;
		overflow-y: auto;
		overscroll-behavior: contain;
		min-height: 0;
	}
</style>
