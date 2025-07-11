import { Component, inject } from '@angular/core';
import { RefresherCustomEvent } from '@ionic/angular';
import { InputDataService } from '../services/input-data.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { InputField } from '../interfaces/input-field';
import { CalculationService } from '../services/calculation.service';
import { RenderService } from '../services/render.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {
  private inputDataService = inject(InputDataService);
  private calcService = inject(CalculationService);
  private renderService = inject(RenderService);
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
      rsh,
    } = this.calcService.calculateBasicParams(dsh, u, i,Rout);

    this.logBasicParams(i, e, rd, Rout, Rin, zg, zsh, dsh, Rsep_m, hc);

    const {check, value} = this.calcService.checkBasicParamsValidity(Rin, zg, dsh);
    if (check) {
      console.log("Так не пойдет -_-)");
      console.log(`Внутренний радиус впадин жесткого колеса Rin(${Rin}мм) должен быть больше: ${value.toFixed(3)}мм. Увеличьте Rout или уменьшите передаточное число ${i}!`);
    } else {
      const { xy, x_sh, y_sh } = this.calcService.calculateAdditionalParams(
        RESOLUTION,
        zg,
        rsh,
        e,
        rd,
        zsh
      );
      console.log(xy);
      console.log(x_sh);
      // this.renderService.generateWheelProfile({
      //   BASE_WHEEL_SHAPE,
      //   SEPARATOR,
      //   ECCENTRIC,
      //   BALLS,
      //   OUT_DIAMETER,
      //   xy,
      //   Rout,
      //   Rin,
      //   Rsep_out,
      //   Rsep_in,
      //   e,
      //   rd,
      //   zsh,
      //   rsh,
      //   x_sh,
      //   y_sh,
      //   D
      // });
    }
  }

  /**
   * Logs the basic parameters of the ВПТК (Ball Wave Gearing) to the console in a formatted manner (like in the original app).
   *
   * @param i - Передаточное число (Transmission ratio)
   * @param e - Эксцентриситет (Eccentricity)
   * @param rd - Радиус эксцентрика (Radius of the eccentric)
   * @param Rout - Внешний радиус профиля жесткого колеса (Outer radius of the rigid wheel profile)
   * @param Rin - Внутренний радиус профиля жесткого колеса (Inner radius of the rigid wheel profile)
   * @param zg - Число впадин профиля жесткого колеса (Number of profile depressions of the rigid wheel)
   * @param zsh - Число шариков (Number of balls)
   * @param dsh - Диаметр шариков (Diameter of balls)
   * @param Rsep_m - Делительный радиус сепаратора (Pitch radius of the separator)
   * @param hc - Толщина сепаратора (Thickness of the separator)
   */
  private logBasicParams(i: any, e: number, rd: number, Rout: any, Rin: number, zg: number, zsh: number, dsh: any, Rsep_m: number, hc: number) {
    console.log(`
........................
Основные параметры ВПТК:
- Передаточное число (i): ${i}
- Эксцентриситет (e): ${e}
- Радиус эксцентрика (rd): ${rd}
- Внешний радиус профиля жесткого колеса (Rout): ${Rout}
- Внутренний радиус профиля жесткого колеса (Rin): ${Rin}
- Число впадин профиля жесткого колеса (zg): ${zg}
- Число шариков (zsh): ${zsh}
- Диаметр шариков (dsh): ${dsh}
- Делительный радиус сепаратора (Rsep_m): ${Rsep_m}
- Толщина сепаратора (hc): ${hc}
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
      formGroup[flag.formControlName] = [ flag.placeholder.toLowerCase() === 'true' ];
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
  // Show/hide additional blueprint flags
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
