import { Injectable } from '@angular/core';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { environment } from '@environments/environment.development';
import { faker } from '@faker-js/faker';

/**
 * Service for managing social media fields in the staff form
 */
@Injectable({
  providedIn: 'root'
})
export class SocialMediaFieldsService {
  /**
   * Get social media fields configuration
   */
  getSocialMediaFields(): FormlyFieldConfig[] {
    const isDev = environment.development;
    const defaultValues = {
      facebook_link: isDev ? `https://facebook.com/${faker.internet.userName()}` : '',
      twitter_link: isDev ? `https://twitter.com/${faker.internet.userName()}` : '',
      linkedin_link: isDev ? `https://linkedin.com/in/${faker.internet.userName()}` : ''
    };

    return [
      {
        fieldGroupClassName: '',
        fieldGroup: [
          {
            fieldGroupClassName: 'grid',
            fieldGroup: [
              {
                key: 'facebook_link',
                type: 'primary-input',
                className: 'col-12 md:col-4',
                props: {
                  required: false,
                  placeholder: 'Facebook link',
                  addonLeft: '<i class="pi pi-facebook"></i>'
                },
                defaultValue: defaultValues.facebook_link
              },
              {
                key: 'twitter_link',
                type: 'primary-input',
                className: 'col-12 md:col-4',
                props: {
                  required: false,
                  placeholder: 'Twitter link',
                  addonLeft: '<i class="pi pi-twitter"></i>'
                },
                defaultValue: defaultValues.twitter_link
              },
              {
                key: 'linkedin_link',
                type: 'primary-input',
                className: 'col-12 md:col-4',
                props: {
                  required: false,
                  placeholder: 'LinkedIn link',
                  addonLeft: '<i class="pi pi-linkedin"></i>'
                },
                defaultValue: defaultValues.linkedin_link
              }
            ]
          }
        ]
      }
    ];
  }
}
