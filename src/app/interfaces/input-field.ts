import { FormControl } from "@angular/forms";

export interface InputField {
  label: string;
  type: string;
  placeholder: string;
  defaultValue: string;
  formControlName: string;
  helperText?: string;
  readonly?: boolean;
}
