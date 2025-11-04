import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sizeTransform',
  standalone: true
})
export class SizeTransformPipe implements PipeTransform {

  transform(value: number, unit: string = 'auto', decimals: number = 2,): string {
    if (!value || value <= 0) {
      return '-';
    }

    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    let i = 0;

    if (unit === 'auto') {
      i = Math.floor(Math.log(value) / Math.log(1024));
    } else {
      i = sizes.indexOf(unit);
      if (i === -1) {
        throw new Error(`Invalid unit: ${unit}. Please use one of ${sizes.join(', ')}`);
      }
    }

    const size = value / Math.pow(1024, i);
    return `${size.toFixed(decimals)} ${sizes[i]}`;
  }

}
