import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ISidebarState } from '@store/sidebar/sidebar.model';

export const selectSidebarState = createFeatureSelector<ISidebarState>('sidebar');

export const selectSidebarIsOpen = createSelector(selectSidebarState, (state: ISidebarState) => state.isOpen);
