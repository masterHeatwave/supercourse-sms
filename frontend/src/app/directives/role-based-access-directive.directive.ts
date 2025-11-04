import { Directive, Input, TemplateRef, ViewContainerRef, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '@store/app.state';
import { selectAuthState } from '@store/auth/auth.selectors';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Directive({
  selector: '[appRoleBasedAccess]', // Changed from appRoleBasedAccessDirective
  standalone: true
})
export class RoleBasedAccessDirective implements OnInit {
  @Input('appRoleBasedAccess') allowedRoles: string[] = []; // Changed input name to match selector
  private destroy$ = new Subject<void>();
  private hasView = false; // To track if the view has already been created

  constructor(private templateRef: TemplateRef<unknown>, private viewContainer: ViewContainerRef, private store: Store<AppState>) {}

  ngOnInit() {
    this.store
      .select(selectAuthState)
      .pipe(takeUntil(this.destroy$))
      .subscribe((authState) => {
        const userRoles: any = authState.user ? authState.user.roles?.map((role: any) => role.id) : [];
        const canAccess = this.checkRoles(userRoles);

        if (canAccess && !this.hasView) {
          this.viewContainer.createEmbeddedView(this.templateRef);
          this.hasView = true;
        } else if (!canAccess && this.hasView) {
          this.viewContainer.clear();
          this.hasView = false;
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkRoles(userRoles: string[]): boolean {
    if (!userRoles) return false;
    return this.allowedRoles.some((role) => userRoles.includes(role));
  }
}
