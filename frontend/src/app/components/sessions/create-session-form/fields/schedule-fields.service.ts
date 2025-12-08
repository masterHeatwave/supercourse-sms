import { Injectable } from '@angular/core';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { getSessionModeOptions } from '../../../../utils/session-modes.util';

@Injectable({ providedIn: 'root' })
export class SessionScheduleFieldsService {
  private classroomsOptions: Array<{ label: string; value: string }> = [];

  private startTimes = [
    { label: 'Time', value: '' },
    { label: '06:00', value: '06:00' },
    { label: '07:00', value: '07:00' },
    { label: '08:00', value: '08:00' },
    { label: '09:00', value: '09:00' },
    { label: '10:00', value: '10:00' },
    { label: '11:00', value: '11:00' },
    { label: '12:00', value: '12:00' },
    { label: '13:00', value: '13:00' },
    { label: '14:00', value: '14:00' },
    { label: '15:00', value: '15:00' },
    { label: '16:00', value: '16:00' },
    { label: '17:00', value: '17:00' },
    { label: '18:00', value: '18:00' },
    { label: '19:00', value: '19:00' },
    { label: '20:00', value: '20:00' }
  ];

  private durations = [
    { label: 'Duration', value: '' },
    { label: '00:30', value: '30' },
    { label: '00:45', value: '45' },
    { label: '01:00', value: '60' },
    { label: '01:30', value: '90' },
    { label: '02:00', value: '120' },
    { label: '02:30', value: '150' },
    { label: '03:00', value: '180' },
    { label: '03:30', value: '210' },
    { label: '04:00', value: '240' },
    { label: '04:30', value: '270' },
    { label: '05:00', value: '300' },
    { label: '05:30', value: '330' },
    { label: '06:00', value: '360' },
    { label: '06:30', value: '390' },
    { label: '07:00', value: '420' },
    { label: '07:30', value: '450' },
    { label: '08:00', value: '480' },
    { label: '08:30', value: '510' },
  ];

  // Use centralized mode configuration
  private modes = [
    { label: 'Mode', value: '' },
    ...getSessionModeOptions()
  ];

  private days = [
    { label: 'Day', value: '' },
    { label: 'Monday', value: 'monday' },
    { label: 'Tuesday', value: 'tuesday' },
    { label: 'Wednesday', value: 'wednesday' },
    { label: 'Thursday', value: 'thursday' },
    { label: 'Friday', value: 'friday' },
    { label: 'Saturday', value: 'saturday' },
    { label: 'Sunday', value: 'sunday' }
  ];

  private frequencies = [
    { label: 'Frequency', value: '' },
    { label: 'Every week', value: 1 },
    { label: 'Every 2 weeks', value: 2 },
    { label: 'Every 3 weeks', value: 3 },
    { label: 'Every 4 weeks', value: 4 }
  ];

  setClassrooms(options: Array<{ label: string; value: string }>): void {
    this.classroomsOptions = options || [];
  }

  getFields(): FormlyFieldConfig[] {
    return [
      { template: `<hr class="my-3 border-primary" />` },
      { template: `<h3 class="text-primary font-bold text-2xl mb-2">Sessions:</h3>` },
      {
        fieldGroupClassName: 'grid',
        fieldGroup: [
          {
            key: 'dateRange',
            type: 'primary-calendar',
            className: 'col-12 md:col-3',
            props: {
              required: true,
              placeholder: 'Start - End',
              selectionMode: 'range'
            }
          },
          {
            key: 'startTime',
            type: 'primary-select',
            className: 'col-12 md:col-2',
            props: {
              required: true,
              selectOptions: this.startTimes.slice(1),
              placeholder: 'Start Time'
            }
          },
          {
            key: 'duration',
            type: 'primary-select',
            className: 'col-12 md:col-2',
            props: {
              required: true,
              selectOptions: this.durations.slice(1),
              placeholder: 'Duration'
            }
          },
          {
            key: 'mode',
            type: 'primary-select',
            className: 'col-12 md:col-2',
            props: {
              required: true,
              selectOptions: this.modes.slice(1),
              placeholder: 'Mode',
              defaultValue: 'in_person'
            }
          },
          {
            key: 'classroom',
            type: 'primary-select',
            className: 'col-12 md:col-3',
            props: {
              required: true,
              selectOptions: this.classroomsOptions,
              placeholder: 'Classroom'
            }
          },
          {
            key: 'day',
            type: 'primary-select',
            className: 'col-12 md:col-2',
            props: {
              required: true,
              selectOptions: this.days.slice(1),
              placeholder: 'Day'
            }
          },
          {
            key: 'frequency',
            type: 'primary-select',
            className: 'col-12 md:col-2',
            props: {
              required: true,
              selectOptions: this.frequencies.slice(1),
              placeholder: 'Frequency'
            }
          },
          {
            key: 'inviteParticipants',
            type: 'primary-checkbox',
            className: 'col-12 md:col-3 align-items-center',
            props: {
              name: 'inviteParticipants',
              label: 'sessions.create.invite_participants',
              styleClass: 'mt-3'
            }
          }
        ]
      }
    ];
  }

  constructor() {}
}


