import { Pipe, PipeTransform } from '@angular/core';

/** Formats a number as money. Change the prefix here to switch currency everywhere. */
@Pipe({ name: 'money' })
export class MoneyPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return (
      'Rs. ' +
      (value ?? 0).toLocaleString('en-LK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }
}
