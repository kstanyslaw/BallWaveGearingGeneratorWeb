import { Component, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { AlertService } from './alert.service';

@Component({
  selector: 'app-alert',
  template: `
      <ion-alert
      [isOpen]="isOpen"
      [header]="header"
      [subHeader]="subHeader"
      [message]="message"
      [buttons]="alertButtons"
      (didDismiss) = "hideAlert()"
    ></ion-alert>
  `,
  standalone: true,
  imports: [IonicModule]
})
export class AlertComponent {
  alertService = inject(AlertService);
  alertButtons = ['Закрыть'];

  get isOpen(): boolean {
    return this.alertService.isOpen();
  }

  get header(): string {
    return this.alertService.header();
  }

  get subHeader(): string {
    return this.alertService.subHeader();
  }

  get message(): string {
    return this.alertService.message();
  }

  hideAlert() {
    this.alertService.hideAlert();
  }
}
