import { error, json } from '@sveltejs/kit';
import { plexFetch, plexJson, readPlexSettings } from '$lib/server/plex';
import type { RequestHandler } from './$types';

/*
 * Starts an item on a Plex client (a Plex app that advertises itself to the
 * server). A play queue is made on the server first, then the client is told
 * to play it through the server, which relays the command. Home Assistant
 * media players are played from the browser through the Plex integration.
 */
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	const client = typeof body?.client === 'string' ? body.client : '';
	const key = typeof body?.key === 'string' && /^\d+$/.test(body.key) ? body.key : '';
	if (!client || !key) error(400, 'client and key are required');
	const settings = await readPlexSettings();
	if (!settings) error(503, 'Plex is not set up');

	try {
		const server = (await plexJson(settings, '/')).MediaContainer;
		const machineIdentifier: string = server.machineIdentifier;
		const queueQuery = new URLSearchParams({
			type: 'video',
			uri: `server://${machineIdentifier}/com.plexapp.plugins.library/library/metadata/${key}`,
			shuffle: '0',
			repeat: '0',
			continuous: '1',
			own: '1'
		});
		const queue = (await plexJson(settings, `/playQueues?${queueQuery}`, 'POST')).MediaContainer;

		const address = new URL(settings.url);
		const playQuery = new URLSearchParams({
			type: 'video',
			commandID: String(Date.now() % 100000),
			providerIdentifier: 'com.plexapp.plugins.library',
			containerKey: `/playQueues/${queue.playQueueID}`,
			key: `/library/metadata/${queue.playQueueSelectedMetadataItemID}`,
			offset: '0',
			machineIdentifier,
			protocol: address.protocol.replace(':', ''),
			address: address.hostname,
			port: address.port || (address.protocol === 'https:' ? '443' : '32400'),
			token: settings.token
		});
		const played = await plexFetch(settings, `/player/playback/playMedia?${playQuery}`, {
			accept: 'application/xml',
			headers: { 'X-Plex-Target-Client-Identifier': client }
		});
		if (!played.ok) error(502, `The Plex client did not accept playback (${played.status})`);
	} catch (failure) {
		if (failure && typeof failure === 'object' && 'status' in failure) throw failure;
		error(502, failure instanceof Error ? failure.message : 'Plex did not answer');
	}
	return json({ ok: true });
};
