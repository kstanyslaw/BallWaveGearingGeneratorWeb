import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  header = signal('');
  subHeader = signal('');
  message = signal('');
  isOpen = signal(false);

  constructor() { }

  public showAlert(message: string, header: string, subHeader: string) {
    this.header.set(header);
    this.subHeader.set(subHeader);
    this.message.set(message);
    this.isOpen.set(true);
  }

  public hideAlert() {
    this.isOpen.set(false);
  }
}
