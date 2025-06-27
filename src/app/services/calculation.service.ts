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


  /**
   * Calculates the result matrix based on the provided angular matrix, gear teeth count, eccentricity, shaft radius, and disk radius.
   *
   * @note To calculate S_sh use sh_angle instead of theta.
   *
   * The calculation involves:
   * 1. Multiplying each element of the `theta` matrix by `zg`.
   * 2. Applying the sine function to each element of the resulting matrix.
   * 3. Multiplying each sine value by `e` and squaring the result.
   * 4. Adding `rsh` and `rd`, squaring the sum, and subtracting the squared sine values from this.
   * 5. Taking the square root of the result.
   *
   * @param theta (sh_angle) - A matrix of angular values (in radians).
   * @param zg - The number of gear teeth.
   * @param e - The eccentricity value.
   * @param rsh - The shaft radius.
   * @param rd - The disk radius.
   * @returns The resulting matrix after performing the described calculations.
   */
  private getS(theta: Matrix, zg: number, e: number, rsh: number, rd: number): MathType {
    // S = math.sqrt((rsh + rd) ** 2 - np.power(e * np.sin(zg * theta), 2));
    // S_sh = np.sqrt((rsh + rd) ** 2 - np.power(e * np.sin(zg * sh_angle), 2));
    // Difference between S and S_sh is only `sh_angle` instead of `theta`
    const math = create(all, { number: 'BigNumber' });
    // subtrahend = (rsh + rd) ** 2
    const subtrahend = math
      .chain(rsh)
      .add(rd)
      .pow(2)
      .done();
    // subtractor = np.power(e * np.sin(zg * theta), 2)
    const subtractor = math
      .chain(theta)
      .multiply(zg)
      .map(math.sin)
      .multiply(e)
      .pow(2)
      .done();
    // sqrt(subtrahend - subtractor)
    return math
      .chain(subtrahend)
      .subtract(subtractor)
      .pow(0.5)
      .done() as Matrix;
  }

  private getXi(theta: Matrix, zg: number, e: number, S: MathType): Matrix {
    // Xi = np.arctan2(e*zg*np.sin(zg*theta), S);
    const math = create(all, { number: 'BigNumber' });
    // atanArg = e*zg*np.sin(zg*theta)
    const atanArg = math
      .chain(theta)
      .multiply(theta)
      .map(math.sin)
      .multiply(zg)
      .multiply(e)
      .done();
    return math.atan2(atanArg, S as Matrix);
  }
}
