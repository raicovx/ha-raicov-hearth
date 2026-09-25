<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import type { CardEditorProps } from '../types';
	import type { TemplateCard } from './descriptor';
	import CodeField from '../../edit/CodeField.svelte';
	import IconField from '../../edit/IconField.svelte';
	import TextField from '../../edit/TextField.svelte';

	let { initial: initialProp, onchange }: CardEditorProps<TemplateCard> = $props();

	// remounted per target and type, so the initial value is all the form needs
	// svelte-ignore state_referenced_locally
	const initial = initialProp;

	let title = $state(initial?.title ?? '');
	let icon = $state(initial?.icon ?? '');
	let template = $state(initial?.template ?? '');

	$effect(() => {
		onchange({
			fields: {
				title: title.trim() || undefined,
				icon: icon.trim() || undefined,
				template: template.trim() ? template : undefined
			}
		});
	});
</script>

<div class="row">
	<div class="grow">
		<TextField label={$lang('hearth_title')} bind:value={title} />
	</div>
	<div class="icon-column">
		<IconField label={$lang('icon')} bind:value={icon} placeholder="notes" />
	</div>
</div>
<CodeField
	label={$lang('hearth_template')}
	language="jinja2"
	bind:value={template}
	placeholder={"- **{{ states('sensor.outdoor') }}** outside"}
/>
<div class="hint">{$lang('hearth_template_card_hint')}</div>
