import type { WidgetDescriptor } from '../types';
import { templateWidget as definition, type TemplateWidget } from '../../model/widgets/template';
export type { TemplateWidget } from '../../model/widgets/template';

export const templateWidget: WidgetDescriptor<TemplateWidget> = {
	...definition,
	load: () => import('./Widget.svelte'),
	editor: () => import('./Editor.svelte')
};
