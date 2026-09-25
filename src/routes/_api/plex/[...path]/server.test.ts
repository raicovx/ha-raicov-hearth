// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './+server';
import { plexFetch, readPlexSettings } from '$lib/server/plex';

vi.mock('$lib/server/plex', () => ({ readPlexSettings: vi.fn(), plexFetch: vi.fn() }));

const SETTINGS = { url: 'http://plex.lan:32400', token: 'secret' };

function get(path: string, query = '') {
	return GET({
		params: { path },
		url: new URL(`http://localhost/_api/plex/${path}${query}`),
		setHeaders: vi.fn()
	} as unknown as Parameters<typeof GET>[0]) as Promise<Response>;
}

async function status(response: Promise<Response>) {
	try {
		return (await response).status;
	} catch (failure) {
		return (failure as { status: number }).status;
	}
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(readPlexSettings).mockResolvedValue(SETTINGS);
	vi.mocked(plexFetch).mockResolvedValue(new Response('{"MediaContainer":{}}'));
});

describe('Plex proxy', () => {
	it('passes the paths the card reads, without a token of the caller', async () => {
		expect(await status(get('hubs/search', '?query=up&X-Plex-Token=forged'))).toBe(200);
		expect(plexFetch).toHaveBeenCalledWith(SETTINGS, '/hubs/search?query=up', {
			accept: 'application/json'
		});
	});

	it.each(['library/sections/1/refresh', ':/prefs', 'playQueues', '../configuration.yaml'])(
		'refuses %s',
		async (path) => {
			expect(await status(get(path))).toBe(404);
			expect(plexFetch).not.toHaveBeenCalled();
		}
	);

	it('says Plex is not set up rather than calling out', async () => {
		vi.mocked(readPlexSettings).mockResolvedValue(null);
		expect(await status(get('library/sections'))).toBe(503);
		expect(plexFetch).not.toHaveBeenCalled();
	});
});
