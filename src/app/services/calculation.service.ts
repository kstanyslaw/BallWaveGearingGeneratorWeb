import { Injectable } from '@angular/core';
import { BasicParams } from '../interfaces/basic-params';
import Decimal from 'decimal.js';

@Injectable({
  providedIn: 'root'
})
export class CalculationService {

  constructor() { }

  /**
   * Calculates fundamental geometric parameters for mechanical component design.
   * Primarily used for bearing or gear-related calculations in mechanical systems.
   *
   * @param {number} dsh - Diameter of the rolling element (ball/roller) in mm or other consistent units
   * @param {number} u - Gear module or pitch parameter
   * @param {number} i - Gear ratio or element count (may be negative)
   * @param {number} Rout - Outer radius of the component assembly
   *
   * @returns {BasicParams} Object containing calculated geometric parameters:
   *   - dsh: Input rolling element diameter (unchanged)
   *   - e: Wall thickness (0.2 × dsh)
   *   - hc: Cage/retainer height (2.2 × e)
   *   - i: Input gear ratio (unchanged)
   *   - rd: Raceway diameter (Rin + e - dsh)
   *   - Rin: Inner assembly radius (Rout - 2e)
   *   - Rout: Input outer radius (unchanged)
   *   - Rsep_in: Inner separator radius (Rsep_m - hc/2)
   *   - Rsep_m: Mid separator radius (rd + rsh)
   *   - Rsep_out: Outer separator radius (Rsep_m + hc/2)
   *   - zg: Gear-related parameter ((i + 1) × u)
   *   - zsh: Copy of input gear ratio (i)
   *
   * @notes
   * 1. All linear parameters must use consistent units
   * 2. Negative 'i' values may produce negative parameters
   * 3. Results may be invalid if Rout < 2e (produces negative Rin)
   * 4. For bearings: dsh typically matches rolling element diameter
   * 5. For gears: u typically represents module (mm/tooth)
   *
   * @example
   * // Bearing calculation example
   * const params = calculateBasicParams(10, 5, 3, 100);
  */
  public calculateBasicParams(
    dsh: number,
    u: number,
    i: number,
    Rout: number
  ): BasicParams {
    Decimal.set({precision: 4});
    const _dsh = new Decimal(dsh);
    const _u = new Decimal(u);
    const _i = new Decimal(i);
    const _Rout = new Decimal(Rout);
    let e = _dsh.mul(0.2);
    let zg = _u.mul(_i.plus(1));
    let zsh = _i;
    let Rin = _Rout.minus((e).mul(2));
    let rsh = _dsh.div(2);
    let rd = Rin.plus(e).minus(_dsh);
    let hc = e.mul(2.2);
    let Rsep_m = rd.plus(rsh);
    let Rsep_out = hc.div(2).plus(Rsep_m);
    let Rsep_in = Rsep_m.minus(hc.div(2));
    return {
      dsh: _dsh.toNumber(),
      e: e.toNumber(),
      hc: hc.toNumber(),
      i: _i.toNumber(),
      rd: rd.toNumber(),
      Rin: Rin.toNumber(),
      Rout: _Rout.toNumber(),
      Rsep_in: Rsep_in.toNumber(),
      Rsep_m: Rsep_m.toNumber(),
      Rsep_out: Rsep_out.toNumber(),
      zg: zg.toNumber(),
      zsh: zsh.toNumber(),
    }
  }
}
