import { Component, inject } from '@angular/core';
import { RefresherCustomEvent } from '@ionic/angular';
import { InputDataService } from '../services/input-data.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {
  private inputDataService = inject(InputDataService);
  constructor() {}

  refresh(ev: any) {
    setTimeout(() => {
      (ev as RefresherCustomEvent).detail.complete();
    }, 3000);
  }

  get inputFields () {
    return this.inputDataService.InputFields;
  }
}
