import { Injectable } from '@angular/core';
import { BasicParams } from '../interfaces/basic-params';

@Injectable({
  providedIn: 'root'
})
export class CalculationService {

  constructor() { }

  public calculateBasicParams(
    dsh: number,
    u: number,
    i: number,
    Rout: number
  ): BasicParams {
    let e = 0.2 * dsh;
    let zg = (i + 1) * u;
    let zsh = i;
    let Rin = Rout - 2 * e;
    let rsh = dsh / 2;
    let rd = Rin + e - dsh;
    let hc = 2.2 * e;
    let Rsep_m = rd + rsh;
    let Rsep_out = Rsep_m + hc / 2;
    let Rsep_in = Rsep_m - hc / 2;
    return {
      dsh,
      e,
      hc,
      i,
      rd,
      Rin,
      Rout,
      Rsep_in,
      Rsep_m,
      Rsep_out,
      zg,
      zsh,
    }
  }
}
