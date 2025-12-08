import { ApplicationConfig, importProvidersFrom, isDevMode, PLATFORM_ID } from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { HttpClient, HttpClientModule, provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { AuthEffects } from '@store/auth/auth.effects';
import { authReducer } from '@store/auth/auth.reducer';
import { routes } from 'app/app.routes';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { localStorageSync } from 'ngrx-store-localstorage';
import { ActionReducer, MetaReducer } from '@ngrx/store';
import { httpInterceptor } from '@interceptors/http.interceptor';
import { FormlyModule } from '@ngx-formly/core';
import { PrimaryInputComponent } from '@components/inputs/primary-input/primary-input.component';
import { PrimaryUploadFileComponent } from '@components/inputs/primary-upload-file/primary-upload-file.component';
import { PrimarySelectComponent } from '@components/inputs/primary-select/primary-select.component';
import { PrimaryUploadComponent } from '@components/inputs/primary-upload/primary-upload.component';
import { PrimaryToggleComponent } from '@components/inputs/primary-toggle/primary-toggle.component';
import { PrimaryCheckboxComponent } from '@components/inputs/primary-checkbox/primary-checkbox.component';
import { PrimayColorSelectComponent } from '@components/inputs/primay-color-select/primay-color-select.component';
import { PrimaryCalendarComponent } from '@components/inputs/primary-calendar/primary-calendar.component';
import { FormlyPrimeNGModule } from '@ngx-formly/primeng';
import { ReactiveFormsModule } from '@angular/forms';
import { RoleBasedAccessDirective } from '@directives/role-based-access-directive.directive';
import { sidebarReducer } from '@store/sidebar/sidebar.reducer';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideQueryClientOptions } from '@ngneat/query';
import { MessageService } from 'primeng/api';
import { PrimaryMultiSelectComponent } from './components/inputs/primary-multi-select/primary-multi-select.component';
import { PrimaryDateRangeComponent } from './components/inputs/primary-date-range/primary-date-range.component';
import { PrimaryTextareaComponent } from './components/inputs/primary-textarea/primary-textarea.component';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export function localStorageSyncReducer(reducer: ActionReducer<any>): ActionReducer<any> {
  return (state, action) => {
    if (typeof window !== 'undefined' && localStorage) {
      return localStorageSync({
        keys: ['auth'],
        rehydrate: true,
        storage: localStorage
      })(reducer)(state, action);
    }
    return reducer(state, action);
  };
}

export function debug(reducer: ActionReducer<any>): ActionReducer<any> {
  return function (state, action) {
    // eslint-disable-next-line no-console
    // console.log('state', state);
    // eslint-disable-next-line no-console
    // console.log('action', action);
    return reducer(state, action);
  };
}

const metaReducers: Array<MetaReducer<any, any>> = [localStorageSyncReducer];

if (isDevMode()) {
  metaReducers.push(debug);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withRouterConfig({ onSameUrlNavigation: 'reload' })),
    provideStore({ auth: authReducer, sidebar: sidebarReducer }, { metaReducers }),
    provideEffects([AuthEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
    provideHttpClient(withInterceptors([httpInterceptor]), withFetch()),
    provideAnimations(),
    provideQueryClientOptions({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: true,
          staleTime: 100
        }
      }
    }),
    importProvidersFrom(
      HttpClientModule,
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        }
      }),
      RoleBasedAccessDirective,
      ReactiveFormsModule,
      FormlyModule.forRoot({
        types: [
          { name: 'primary-input', component: PrimaryInputComponent },
          { name: 'primary-select', component: PrimarySelectComponent },
          { name: 'primary-upload', component: PrimaryUploadComponent },
          { name: 'primary-upload-file', component: PrimaryUploadFileComponent },
          { name: 'primary-checkbox', component: PrimaryCheckboxComponent },
          { name: 'primary-toggle', component: PrimaryToggleComponent },
          { name: 'primay-color-select', component: PrimayColorSelectComponent },
          { name: 'primary-multi-select', component: PrimaryMultiSelectComponent },
          { name: 'primary-date-range', component: PrimaryDateRangeComponent },
          { name: 'primary-calendar', component: PrimaryCalendarComponent },
          { name: 'primary-textarea', component: PrimaryTextareaComponent }
        ]
      }),
      FormlyPrimeNGModule
    ),
    MessageService,
    {
      provide: PLATFORM_ID,
      useValue: typeof window === 'undefined' ? 'server' : 'browser'
    }
  ]
};
