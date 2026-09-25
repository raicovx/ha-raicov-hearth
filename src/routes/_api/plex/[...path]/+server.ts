import { error } from '@sveltejs/kit';
import { plexFetch, readPlexSettings } from '$lib/server/plex';
import type { RequestHandler } from './$types';

/*
 * Read-only pass-through to the configured Plex server. Only the paths the
 * Plex card reads are allowed, so this is not a general way into Plex with
 * the stored token.
 */
const ALLOWED = [
	/^$/,
	/^clients$/,
	/^library\/sections$/,
	/^library\/sections\/\d+\/all$/,
	/^library\/metadata\/\d+$/,
	/^library\/metadata\/\d+\/children$/,
	/^hubs\/home\/recentlyAdded$/,
	/^hubs\/search$/,
	/^photo\/:\/transcode$/
];

export const GET: RequestHandler = async ({ params, url, setHeaders }) => {
	const path = params.path ?? '';
	if (!ALLOWED.some((pattern) => pattern.test(path))) error(404, 'Not a Plex path Hearth reads');
	const settings = await readPlexSettings();
	if (!settings) error(503, 'Plex is not set up');

	const query = new URLSearchParams(url.searchParams);
	query.delete('X-Plex-Token');
	const image = path === 'photo/:/transcode';
	let response: Response;
	try {
		response = await plexFetch(settings, `/${path}${query.size ? `?${query}` : ''}`, {
			accept: image ? 'image/*' : 'application/json'
		});
	} catch (failure) {
		error(502, failure instanceof Error ? failure.message : 'Plex did not answer');
	}
	if (!response.ok) error(response.status === 401 ? 502 : response.status, 'Plex refused');

	// posters never change for a given transcode URL; listings do
	setHeaders({ 'Cache-Control': image ? 'private, max-age=86400' : 'no-store' });
	return new Response(response.body, {
		headers: { 'Content-Type': response.headers.get('Content-Type') ?? 'application/json' }
	});
};
