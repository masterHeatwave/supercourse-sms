import { FormlyFieldConfig } from '@ngx-formly/core';

export interface ClassroomFormData {
  name: string;
  customer: string;
  location: string;
  capacity: number | undefined;
  type: string;
  equipment: string[];
  availability: string;
  description: string;
}

export const classroomTypes = [
  { label: 'Standard', value: 'standard' },
  { label: 'Computer Lab', value: 'computer_lab' },
  { label: 'Science Lab', value: 'science_lab' },
  { label: 'Art Studio', value: 'art_studio' },
  { label: 'Music Room', value: 'music_room' },
  { label: 'Gymnasium', value: 'gymnasium' },
  { label: 'Library', value: 'library' },
  { label: 'Conference Room', value: 'conference_room' }
];

export const availabilityOptions = [
  { label: 'Available', value: 'available' },
  { label: 'Unavailable', value: 'unavailable' },
  { label: 'Out of Order', value: 'out_of_order' },
  { label: 'Under Maintenance', value: 'under_maintenance' }
];

export const equipmentOptions = [
  { label: 'Projector', value: 'Projector' },
  { label: 'Smart Board', value: 'Smart Board' },
  { label: 'Computers', value: 'Computers' },
  { label: 'Laptop', value: 'Laptop' },
  { label: 'Audio System', value: 'Audio System' },
  { label: 'Microphone', value: 'Microphone' },
  { label: 'Speakers', value: 'Speakers' },
  { label: 'TV/Monitor', value: 'TV/Monitor' },
  { label: 'Document Camera', value: 'Document Camera' },
  { label: 'Printer', value: 'Printer' },
  { label: 'Scanner', value: 'Scanner' },
  { label: 'Whiteboard', value: 'Whiteboard' },
  { label: 'Blackboard', value: 'Blackboard' },
  { label: 'Tables', value: 'Tables' },
  { label: 'Chairs', value: 'Chairs' },
  { label: 'Air Conditioning', value: 'Air Conditioning' },
  { label: 'Heating', value: 'Heating' },
  { label: 'Internet Access', value: 'Internet Access' },
  { label: 'WiFi', value: 'WiFi' },
  { label: 'Ethernet Ports', value: 'Ethernet Ports' },
  { label: 'Power Outlets', value: 'Power Outlets' },
  { label: 'Laboratory Equipment', value: 'Laboratory Equipment' },
  { label: 'Musical Instruments', value: 'Musical Instruments' },
  { label: 'Art Supplies', value: 'Art Supplies' },
  { label: 'Sports Equipment', value: 'Sports Equipment' }
];

export function createClassroomFields(branches: { label: string; value: string }[] = []): FormlyFieldConfig[] {
  return [
    {
      fieldGroupClassName: 'grid',
      fieldGroup: [
        {
          className: 'col-12 md:col-6',
          key: 'name',
          type: 'primary-input',
          props: {
            label: 'Classroom Name',
            placeholder: 'Enter classroom name',
            required: true,
            labelClass: 'text-black-alpha-90'
          },
          validation: {
            messages: {
              required: 'Classroom name is required'
            }
          }
        },
        {
          className: 'col-12 md:col-6',
          key: 'customer',
          type: 'primary-select',
          props: {
            label: 'Branch',
            placeholder: 'Select branch',
            required: true,
            selectOptions: branches,
            labelClass: 'text-black-alpha-90'
          },
          validation: {
            messages: {
              required: 'Please select a branch'
            }
          }
        },
        {
          className: 'col-12 md:col-6',
          key: 'location',
          type: 'primary-input',
          props: {
            label: 'Location',
            placeholder: 'Enter location (e.g., Building A, Floor 2)',
            labelClass: 'text-black-alpha-90'
          }
        },
        {
          className: 'col-12 md:col-6',
          key: 'capacity',
          type: 'input',
          props: {
            type: 'number',
            label: 'Capacity',
            placeholder: 'Max students',
            min: 1,
            max: 500,
            labelClass: 'text-black-alpha-90'
          }
        },
        {
          className: 'col-12 md:col-6',
          key: 'type',
          type: 'primary-select',
          props: {
            label: 'Type',
            placeholder: 'Select type',
            labelClass: 'text-black-alpha-90',
            selectOptions: classroomTypes
          }
        },
        {
          className: 'col-12 md:col-6',
          key: 'availability',
          type: 'primary-select',
          props: {
            label: 'Availability',
            placeholder: 'Select availability status',
            labelClass: 'text-black-alpha-90',
            selectOptions: availabilityOptions
          }
        },
        {
          className: 'col-12',
          key: 'equipment',
          type: 'primary-multi-select',
          props: {
            label: 'Equipment',
            placeholder: 'Select equipment',
            labelClass: 'text-black-alpha-90',
            selectOptions: equipmentOptions
          }
        },
        {
          className: 'col-12',
          key: 'description',
          type: 'primary-textarea',
          props: {
            label: 'Description',
            placeholder: 'Additional details about the classroom',
            rows: 3,
            labelClass: 'text-black-alpha-90'
          }
        }
      ]
    }
  ];
}
