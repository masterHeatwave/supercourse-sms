import { createActionGroup, emptyProps } from '@ngrx/store';

export const SidebarActions = createActionGroup({
  source: 'Sidebar',
  events: {
    'Toggle Sidebar': emptyProps()
  }
});
