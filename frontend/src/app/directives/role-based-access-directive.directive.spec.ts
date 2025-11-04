import { RoleBasedAccessDirective } from './role-based-access-directive.directive';
import { TemplateRef, ViewContainerRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '@store/app.state';

describe('RoleBasedAccessDirective', () => {
  it('should create an instance', () => {
    const directive = new RoleBasedAccessDirective({} as TemplateRef<unknown>, {} as ViewContainerRef, {} as Store<AppState>);
    expect(directive).toBeTruthy();
  });
});
