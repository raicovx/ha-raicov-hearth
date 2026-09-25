<script lang="ts">
	import { ICON } from '../../iconSizes';
	import { lang } from '$lib/core/i18n';
	import Icon from '../../Icon.svelte';
	import {
		fetchSpotifyDevices,
		playSpotifyUri,
		type RecentTrack,
		type SpotifyDevice
	} from '../../media';

	let {
		track,
		entity,
		spEntity,
		defaultDevice,
		readonly = false,
		onplayed
	}: {
		track: RecentTrack;
		/** the card's player, which playSpotifyUri pairs with its SpotifyPlus twin */
		entity: string;
		spEntity: string;
		defaultDevice?: string;
		/** the editor preview shows the list without playing anything */
		readonly?: boolean;
		onplayed: () => void;
	} = $props();

	let devices = $state<SpotifyDevice[] | null | undefined>(undefined);

	function load() {
		devices = undefined;
		fetchSpotifyDevices(spEntity).then((found) => (devices = found));
	}

	$effect(load);

	// the one already playing first, then the card's preferred device
	let ordered = $derived(
		devices
			? [...devices].sort(
					(a, b) =>
						Number(b.active) - Number(a.active) ||
						Number(b.name === defaultDevice) - Number(a.name === defaultDevice)
				)
			: []
	);

	const KIND_ICONS: Record<string, string> = {
		speaker: 'speaker',
		castaudio: 'speaker',
		computer: 'computer',
		smartphone: 'smartphone',
		tablet: 'tablet',
		tv: 'tv',
		castvideo: 'tv',
		avr: 'speaker_group',
		stb: 'tv',
		gameconsole: 'sports_esports',
		automobile: 'directions_car'
	};

	function play(deviceId?: string) {
		if (readonly) return;
		// resumes the album or playlist at this track, so the music carries on after it
		void playSpotifyUri(entity, track.contextUri ?? track.uri, defaultDevice, {
			offsetUri: track.contextUri ? track.uri : undefined,
			deviceId
		});
		onplayed();
	}
</script>

<div class="play-on">
	<div class="header">
		<div class="title">{track.name}</div>
		{#if track.artist}
			<div class="artist">{track.artist}</div>
		{/if}
	</div>

	<div class="label">{$lang('hearth_spotify_play_on')}</div>
	{#if devices === undefined}
		<div class="note">{$lang('hearth_loading')}</div>
	{:else if devices === null || !devices.length}
		<div class="note" class:error={devices === null}>
			{devices === null
				? $lang('hearth_spotify_devices_failed')
				: $lang('hearth_spotify_no_devices')}
		</div>
		<div class="actions">
			<button type="button" class="device pressable" disabled={readonly} onclick={() => play()}>
				<Icon name="play_arrow" size={ICON.control} />
				<span class="name">{$lang('hearth_spotify_play_anyway')}</span>
			</button>
			<button type="button" class="device quiet pressable" onclick={load}>
				<Icon name="refresh" size={ICON.control} />
				<span class="name">{$lang('hearth_retry')}</span>
			</button>
		</div>
	{:else}
		<div class="devices">
			{#each ordered as device (device.id)}
				<button
					type="button"
					class="device pressable"
					class:active={device.active}
					disabled={readonly}
					onclick={() => play(device.id)}
				>
					<Icon name={KIND_ICONS[device.kind.toLowerCase()] ?? 'cast'} size={ICON.control} />
					<span class="name">{device.name}</span>
					{#if device.active}
						<span class="tag">{$lang('playing')}</span>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.play-on {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.header {
		padding: 2px 2px 0;
		min-width: 0;
	}

	.title,
	.artist {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.title {
		color: var(--h-text-1);
		font-size: var(--h-type-title);
		font-weight: 600;
	}

	.artist {
		margin-top: 4px;
		color: var(--h-text-4);
		font-size: var(--h-type-secondary);
	}

	.label {
		font-family: var(--h-font-mono);
		font-size: var(--h-type-label);
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--h-label);
	}

	.devices,
	.actions {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.device {
		display: flex;
		align-items: center;
		gap: 12px;
		min-width: 0;
		padding: 12px 14px;
		border-radius: var(--h-radius-sm);
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.085 * var(--h-line-scale)));
		background: rgb(var(--h-surface-rgb) / calc(0.045 * var(--h-fill-scale)));
		color: var(--h-text-2);
		font: inherit;
		font-size: var(--h-type-body);
		text-align: left;
		cursor: pointer;
	}

	.device.active {
		border-color: rgb(var(--h-accent-rgb) / calc(0.5 * var(--h-accent-scale)));
		background: rgb(var(--h-accent-rgb) / calc(0.14 * var(--h-accent-scale)));
		color: var(--h-accent-text);
	}

	.device.quiet {
		background: none;
		color: var(--h-text-3);
	}

	.device:disabled {
		cursor: default;
	}

	.name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.tag {
		font-family: var(--h-font-mono);
		font-size: var(--h-type-caption);
		letter-spacing: 1.2px;
		text-transform: uppercase;
	}

	.note {
		font-size: var(--h-type-secondary);
		color: var(--h-text-5);
	}

	.note.error {
		color: var(--h-bad-text);
	}
</style>
