import { Injectable } from '@angular/core';
import { BasicParams } from '../interfaces/basic-params';
import { create, all } from 'mathjs'

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
    const math = create(all, { number: 'BigNumber' });
    let e = math.evaluate(`${dsh} * 0.2`);
    let zg = math.evaluate(`${u} * (${i} + 1)`);
    let zsh = i;
    let Rin = math.evaluate(`${Rout} - ${e} * 2`);
    let rsh = math.divide(dsh, 2);
    let rd = math.chain(Rin).add(e).subtract(dsh).done();
    let hc = math.evaluate(`${e} * 2.2`);
    let Rsep_m = math.add(rd, rsh);
    let Rsep_out = math.chain(hc).divide(2).add(Rsep_m).done();
    let Rsep_in = math.evaluate(`${Rsep_m} - (${hc} / 2)`);
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

  // public calculateAdditionalParams(
  //   RESOLUTION: number,
  //   zg: number,
  //   rsh: number,
  //   e: number,
  //   rd: number,
  //   zsh: number,
  // ) {
  //   let theta = math.range(0, math.multiply(2, math.pi), RESOLUTION)

  //   let S = np.sqrt((rsh + rd) ** 2 - np.power(e * np.sin(zg * theta), 2))
  //   let l = e * np.cos(zg * theta) + S
  //   let Xi = np.arctan2(e*zg*np.sin(zg*theta), S)

  //   let x = l*np.sin(theta) + rsh * np.sin(theta + Xi)
  //   let y = l*np.cos(theta) + rsh * np.cos(theta + Xi)

  //   let xy = np.stack((x, y), axis=1)


  //   let sh_angle = math.range(0, 1, zsh+1) * 2*np.pi
  //   let S_sh = np.sqrt((rsh + rd) ** 2 - np.power(e * np.sin(zg * sh_angle), 2))
  //   let l_Sh = e * np.cos(zg * sh_angle) + S_sh
  //   let x_sh = l_Sh*np.sin(sh_angle)
  //   let y_sh = l_Sh*np.cos(sh_angle)
  // }
}
