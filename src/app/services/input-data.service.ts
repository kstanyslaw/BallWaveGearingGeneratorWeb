import { Injectable } from '@angular/core';
import { InputField } from '../interfaces/input-field';

@Injectable({
  providedIn: 'root'
})
export class InputDataService {

  private readonly inputData = [
    { formControlName: 'OUT_FILE', defaultValue: "vptc6.dxf", type: 'string', label: 'Имя файла' },
    { formControlName: 'RESOLUTION', defaultValue: '600', type: 'number', helperText: 'Количество точек построения профиля жесткого колеса', label: 'Точки' },
    { formControlName: 'i', defaultValue: '17', type: 'number', helperText: 'Нужное вам передаточное число (например, 1:17)', label: 'Передаточное число' },
    { formControlName: 'dsh', defaultValue: '6', type: 'number', helperText: 'Диаметр шариков от подшипника', label: 'Диаметр шариков' },
    { formControlName: 'Rout', defaultValue: '38', type: 'number', helperText: 'Внешний радиус впадин жесткого колеса', label: 'Радиус впадин' },
    { formControlName: 'D', defaultValue: '90', type: 'number', helperText: 'Внешний диаметр редуктора (опционально)', label: 'Диаметр редуктора' },
    { formControlName: 'u', defaultValue: '1', type: 'number', helperText: 'Число волн, создаваемых волнообразователем', label: 'Число волн' },
  ];

  private readonly inputFlags = [
    { formControlName: 'BASE_WHEEL_SHAPE', defaultValue: 'True', type: 'boolean', label: 'Профиль жесткого колеса', helperText: '' },
    { formControlName: 'SEPARATOR', defaultValue: 'True', type: 'boolean', label: 'Сепаратор' },
    { formControlName: 'ECCENTRIC', defaultValue: 'True', type: 'boolean', label: 'Волнообразователь/эксцентрик' },
    { formControlName: 'BALLS', defaultValue: 'False', type: 'boolean', label: 'Шарики' },
    { formControlName: 'OUT_DIAMETER', defaultValue: 'True', type: 'boolean', label: 'Внешний диаметр редуктора' },
  ]

  constructor() { }

  public get InputFields(): InputField[] {
    return this.inputData.map((i) => this.convertData(i));
  }

  public get InputFlags(): InputField[] {
    return this.inputFlags.map((i) => this.convertData(i));
  }

  private convertData(i: any): InputField {
    return {
      ...i,
      helperText: i?.helperText ?? '',
      placeholder: i.defaultValue,
    } as InputField;
  }
}
