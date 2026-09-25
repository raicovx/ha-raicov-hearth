import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import CardRenderer from '../../CardRenderer.svelte';
import RailWidgetRenderer from '../../RailWidgetRenderer.svelte';

const templates = vi.hoisted(() => ({
	render: undefined as ((result: string) => void) | undefined
}));

vi.mock('$lib/core/ha/connection', async (importOriginal) => {
	const { readable } = await import('svelte/store');
	return {
		...(await importOriginal<typeof import('$lib/core/ha/connection')>()),
		connected: readable(true)
	};
});

vi.mock('$lib/core/ha/history', async (importOriginal) => ({
	...(await importOriginal<typeof import('$lib/core/ha/history')>()),
	subscribeTemplate: vi.fn((_template: string, onRender: (result: string) => void) => {
		templates.render = onRender;
		return Promise.resolve(() => {});
	})
}));

describe('template card', () => {
	it('shows its icon and title beside the rendered list', async () => {
		const { container } = render(CardRenderer, {
			card: {
				id: 'bills',
				type: 'template',
				title: 'Bills',
				icon: 'payments',
				template: "{{ states('sensor.bills') }}"
			}
		});
		await waitFor(() => expect(templates.render).toBeTypeOf('function'));
		templates.render?.('- **Rent** - $1200.00\n- **Power** - $85.40');

		expect(screen.getByText('Bills')).toBeTruthy();
		expect(container.querySelector('.mi')?.textContent).toBe('payments');
		await waitFor(() => expect(container.querySelectorAll('li')).toHaveLength(2));
		expect(container.querySelector('li strong')?.textContent).toBe('Rent');
	});

	it('asks for configuration until it has a template', () => {
		render(CardRenderer, { card: { id: 't', type: 'template', title: 'Bills' } });
		expect(screen.getByText('Configure Template')).toBeTruthy();
	});

	it('draws the sidebar template widget with its icon and title', async () => {
		const { container } = render(RailWidgetRenderer, {
			widget: {
				id: 'bills',
				type: 'template',
				title: 'Bills',
				icon: 'payments',
				template: '{{ x }}'
			}
		});
		await waitFor(() => expect(templates.render).toBeTypeOf('function'));
		templates.render?.('- **Rent** - $1200.00');
		await waitFor(() => expect(container.querySelector('li strong')?.textContent).toBe('Rent'));
		expect(screen.getByText('Bills')).toBeTruthy();
		expect(container.querySelector('.mi')?.textContent).toBe('payments');
	});
});
