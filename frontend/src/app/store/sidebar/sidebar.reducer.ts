import { createReducer, on } from '@ngrx/store';
import { SidebarActions } from '@store/sidebar/sidebar.actions';
import { ISidebarState } from '@store/sidebar/sidebar.model';

export const initialState: ISidebarState = {
  isOpen: false
};

export const sidebarReducer = createReducer(
  initialState,
  on(SidebarActions.toggleSidebar, (state) => ({
    ...state,
    isOpen: !state.isOpen
  }))
);
