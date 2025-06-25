import { Component, inject } from '@angular/core';
import { RefresherCustomEvent } from '@ionic/angular';
import { InputDataService } from '../services/input-data.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { InputField } from '../interfaces/input-field';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {
  private inputDataService = inject(InputDataService);
  paramsForm!: FormGroup;
  inputFields!: InputField[];
  inputFlags!: InputField[];

  constructor(private fb: FormBuilder) {}

  refresh(ev: any) {
    setTimeout(() => {
      (ev as RefresherCustomEvent).detail.complete();
    }, 3000);
  }

  ngOnInit() {
    this.inputFields = this.inputDataService.InputFields;
    this.inputFlags = this.inputDataService.InputFlags;
    this.paramsForm = new FormGroup({});
    this.initForm();
  }

  onSubmit(): void {
    console.log(this.paramsForm.value);
  }

  /**
   * Initializes the reactive form for the component by dynamically creating form controls
   * based on the `inputFields` and `inputFlags` arrays. Each form control is initialized
   * with its corresponding placeholder value and marked as required using Angular's Validators.
   * The constructed form group is then assigned to `paramsForm`.
   *
   * @remarks
   * This method assumes that `inputFields` and `inputFlags` are arrays of `InputField` objects,
   * each containing a `formControlName` and a `placeholder` property.
   *
   * @returns void
   */
  initForm(): void {
    const formGroup : any = {};
    this.inputFields.map((field: InputField) => {
      formGroup[field.formControlName] = [ field.placeholder, Validators.required ];
    });
    this.inputFlags.map((flag: InputField) => {
      formGroup[flag.formControlName] = [ flag.placeholder, Validators.required ];
    })
    this.paramsForm = this.fb.group(formGroup);
  }

  /**
   * Retrieves a form control from the `paramsForm` by its name.
   *
   * @param name - The name of the form control to retrieve.
   * @returns The `FormControl` instance associated with the given name.
   * @throws {Error} If the form control with the specified name is not found.
   */
  getControl(name: string): FormControl {
    const control = this.paramsForm.get(name);
    if (!control) {
      throw new Error(`Form control ${name} not found`);
    }
    return control as FormControl;
  }
}
