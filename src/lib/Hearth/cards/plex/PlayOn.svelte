<script lang="ts">
	import { ICON } from '../../iconSizes';
	import { lang, fill } from '$lib/core/i18n';
	import { entityAvailable, states } from '$lib/core/ha/entities';
	import Icon from '../../Icon.svelte';
	import { playOnEntity, playOnPlexClient, type PlexClient, type PlexItem } from '../../plex';

	let {
		item,
		players,
		clients,
		serverName
	}: {
		item: PlexItem;
		/** Home Assistant media players from the card */
		players: string[];
		/** Plex apps the server can see; null while loading */
		clients: PlexClient[] | null;
		serverName?: string;
	} = $props();

	type Target =
		| { kind: 'entity'; id: string; name: string; available: boolean }
		| { kind: 'client'; id: string; name: string; available: true };

	let targets = $derived<Target[]>([
		...players.map((id) => ({
			kind: 'entity' as const,
			id,
			name: $states?.[id]?.attributes?.friendly_name ?? id,
			available: entityAvailable($states?.[id])
		})),
		...(clients ?? []).map((client) => ({
			kind: 'client' as const,
			id: client.machineIdentifier,
			name: client.name,
			available: true as const
		}))
	]);

	let busy = $state<string | null>(null);
	let status = $state<{ tone: 'ok' | 'error'; text: string } | null>(null);

	async function play(target: Target) {
		busy = target.id;
		status = null;
		try {
			if (target.kind === 'entity') playOnEntity(target.id, item, serverName);
			else await playOnPlexClient(target.id, item);
			status = { tone: 'ok', text: fill($lang('hearth_plex_started_on'), { name: target.name }) };
		} catch (failure) {
			status = {
				tone: 'error',
				text: failure instanceof Error ? failure.message : $lang('hearth_plex_play_failed')
			};
		} finally {
			busy = null;
		}
	}
</script>

<div class="play-on">
	<div class="label">{$lang('hearth_plex_play_on')}</div>
	{#if !targets.length}
		<div class="note">
			{clients === null ? $lang('hearth_loading') : $lang('hearth_plex_no_players')}
		</div>
	{:else}
		<div class="targets">
			{#each targets as target (target.id)}
				<button
					type="button"
					class="target pressable"
					disabled={!target.available || busy !== null}
					onclick={() => play(target)}
				>
					<Icon
						name={busy === target.id
							? 'progress_activity'
							: target.kind === 'client'
								? 'smart_display'
								: 'cast'}
						size={ICON.control}
					/>
					<span>{target.name}</span>
				</button>
			{/each}
		</div>
	{/if}
	{#if status}
		<div class="note" class:error={status.tone === 'error'} role="status">{status.text}</div>
	{/if}
</div>

<style>
	.play-on {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.label {
		font-family: var(--h-font-mono);
		font-size: var(--h-type-label);
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--h-label);
	}

	.targets {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.target {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 16px;
		border-radius: var(--h-radius-pill);
		border: 1px solid rgb(var(--h-accent-rgb) / calc(0.3 * var(--h-accent-scale)));
		background: rgb(var(--h-accent-rgb) / calc(0.1 * var(--h-accent-scale)));
		color: var(--h-accent-text);
		font: inherit;
		font-size: var(--h-type-body);
		cursor: pointer;
	}

	.target:disabled {
		opacity: 0.45;
		cursor: default;
	}

	.note {
		font-size: var(--h-type-secondary);
		color: var(--h-text-5);
	}

	.note.error {
		color: var(--h-bad-text);
	}
</style>
