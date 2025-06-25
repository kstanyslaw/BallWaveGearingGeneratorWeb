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

  initForm() {
    const formGroup : any = {};
    this.inputFields.map((field: InputField) => {
      formGroup[field.formControlName] = [ field.placeholder, Validators.required ];
    });
    this.inputFlags.map((flag: InputField) => {
      formGroup[flag.formControlName] = [ flag.placeholder, Validators.required ];
    })
    this.paramsForm = this.fb.group(formGroup);
  }

  getControl(name: string): FormControl {
    const control = this.paramsForm.get(name);
    if (!control) {
      throw new Error(`Form control ${name} not found`);
    }
    return control as FormControl;
  }
}
