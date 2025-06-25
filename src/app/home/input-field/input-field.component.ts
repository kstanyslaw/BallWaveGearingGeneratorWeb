import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { InputField } from 'src/app/interfaces/input-field';

@Component({
  selector: 'app-input-field',
  templateUrl: './input-field.component.html',
  styleUrls: ['./input-field.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputFieldComponent {
  @Input() inputField?: InputField;
  @Input() control!: FormControl;

  get booleanValue(): boolean {
    return this.inputField?.placeholder.toLowerCase() === 'true';
  }
}
