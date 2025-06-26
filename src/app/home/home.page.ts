import { Component, inject } from '@angular/core';
import { RefresherCustomEvent } from '@ionic/angular';
import { InputDataService } from '../services/input-data.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { InputField } from '../interfaces/input-field';
import { CalculationService } from '../services/calculation.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {
  private inputDataService = inject(InputDataService);
  private calcService = inject(CalculationService);
  paramsForm!: FormGroup;
  inputFields!: InputField[];
  inputFlags!: InputField[];
  showFlags: boolean = false;
  darkTheme: boolean = true;

  constructor(private fb: FormBuilder) {}

  refresh(ev: any) {
    setTimeout(() => {
      (ev as RefresherCustomEvent).detail.complete();
    }, 3000);
  }

  ngOnInit() {
    // Theme init
    const localStorageTheme = localStorage.getItem('theme');
    const systemTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.darkTheme = localStorage.getItem('theme') === null
      ? systemTheme
      : localStorageTheme === 'dark';
    this.toggleDarkPalette(this.darkTheme);
    // Forms init
    this.inputFields = this.inputDataService.InputFields;
    this.inputFlags = this.inputDataService.InputFlags;
    this.paramsForm = new FormGroup({});
    this.initForm();
  }

  onSubmit(): void {
    const {
      OUT_FILE,
      RESOLUTION,
      i,
      dsh,
      Rout,
      D,
      u,
      BASE_WHEEL_SHAPE,
      SEPARATOR,
      ECCENTRIC,
      BALLS,
      OUT_DIAMETER
    } = this.paramsForm.value;
    const {
      // dsh,
      e,
      hc,
      // i,
      rd,
      Rin,
      // Rout,
      Rsep_in,
      Rsep_m,
      Rsep_out,
      zg,
      zsh,
    } = this.calcService.calculateBasicParams(dsh, u, i,Rout);
    console.log(`
........................
Основные параметры ВПТК:
- Передаточное число: ", ${i})
- Эксцентриситет: ", ${e})
- Радиус эксцентрика: ", ${rd})
- Внешний радиус профиля жесткого колеса: ", ${Rout})
- Внутренний радиус профиля жесткого колеса: ", ${Rin})
- Число впадин профиля жесткого колеса: ", ${zg})
- Число шариков: ", ${zsh})
- Диаметр шариков: ", ${dsh})
- Делительный радиус сепаратора: ", ${Rsep_m})
- Толщина сепаратора: ", ${hc})
........................
........................
    `);
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
      formGroup[flag.formControlName] = [ flag.placeholder.toLowerCase() === 'true', Validators.required ];
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

  toggleFlags() {
    this.showFlags = !this.showFlags;
  }

  // Listen for the toggle check/uncheck to toggle the dark palette
  toggleTheme() {
    this.darkTheme = !this.darkTheme;
    this.toggleDarkPalette(this.darkTheme);
  }

  // Add or remove the "ion-palette-dark" class on the html element
  toggleDarkPalette(shouldAdd: boolean) {
    localStorage.setItem('theme', shouldAdd ? 'dark' : 'light');
    document.documentElement.classList.toggle('ion-palette-dark', shouldAdd);
  }
}
