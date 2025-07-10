import { Injectable } from '@angular/core';
import { BasicParams } from '../interfaces/basic-params';
import { create, all, Matrix, MathType, MathJsInstance, BigNumber, boolean } from 'mathjs'

@Injectable({
  providedIn: 'root'
})
export class CalculationService {
  private math: MathJsInstance;

  constructor() {
    this.math = create(all, { number: 'BigNumber' });
  }

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
    let e = this.math.evaluate(`${dsh} * 0.2`);
    let zg = this.math.evaluate(`${u} * (${i} + 1)`);
    let zsh = i;
    let Rin = this.math.evaluate(`${Rout} - ${e} * 2`);
    let rsh = this.math.divide(dsh, 2);
    let rd = this.math.chain(Rin).add(e).subtract(dsh).done();
    let hc = this.math.evaluate(`${e} * 2.2`);
    let Rsep_m = this.math.add(rd, rsh);
    let Rsep_out = this.math.chain(hc).divide(2).add(Rsep_m).done();
    let Rsep_in = this.math.evaluate(`${Rsep_m} - (${hc} / 2)`);
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
      rsh
    }
  }

  /**
   * Checks the validity of basic parameters for a gearing calculation.
   *
   * This method verifies whether the input parameter `Rin` satisfies the condition:
   * `Rin <= (1.03 * dsh) / sin(π / zg)`.
   *
   * @param Rin - The input radius or parameter to validate.
   * @param zg - The number of gear teeth.
   * @param dsh - The shaft diameter.
   * @returns `true` if the parameters are valid according to the condition, otherwise `false`.
   */
  public checkBasicParamsValidity(Rin: number | BigNumber, zg: number, dsh: number): {check: boolean, value: number} {
    // Rin <= ((1.03 * dsh)/np.sin(np.pi/zg))
    const numerator = this.math
      .chain(dsh)
      .multiply(1.03)
      .done();
    const denominator = this.math
      .chain(this.math.pi)
      .divide(zg)
      .sin()
      .done();
    const value = this.math.divide(numerator, denominator);
    const check = this.math.smallerEq(Rin, value) as boolean;
    return { check, value };
  }

  /**
   * Calculates additional geometric parameters for the wave gearing mechanism.
   *
   * This method computes several arrays of values based on the provided parameters,
   * including positions, angles, and distances used in the geometry of the mechanism.
   * The calculations involve trigonometric and vector operations, and are typically
   * used for generating the geometry of the wave generator and its associated components.
   *
   * @param RESOLUTION - The number of discrete steps or points for the calculation (resolution of the angle range).
   * @param zg - The number of teeth or lobes on the generator (gear parameter).
   * @param rsh - The radius of the shaft or base circle.
   * @param e - The eccentricity or offset value.
   * @param rd - The radius of the disk or outer circle.
   * @param zsh - The number of shaft positions or holes.
   *
   * @remarks
   * This method relies on several helper functions (`getS`, `getXi`, `getX_Y`) and the `math` library for vectorized operations.
   * The results are typically used for further geometric construction or visualization.
   */
  public calculateAdditionalParams(
    RESOLUTION: number,
    zg: number,
    rsh: number,
    e: number,
    rd: number,
    zsh: number,
  ) {
    const theta = this.math.range(0, this.math.multiply(2, this.math.pi), RESOLUTION);

    // S = sqrt((rsh + rd) ** 2 - np.power(e * np.sin(zg * theta), 2));
    const S = this.getS(theta, zg, e, rsh, rd);
    // l = e * np.cos(zg * theta) + S;
    const l = this.math
      .chain(theta)
      .multiply(zg)
      .map(this.math.cos)
      .multiply(e)
      .add(S)
      .done();
    // Xi = np.arctan2(e*zg*np.sin(zg*theta), S);
    const Xi = this.getXi(theta, zg, e, S);

    // x = l*np.sin(theta) + rsh * np.sin(theta + Xi);
    const x = this.getX_Y(theta, l, Xi, rsh, this.math.sin);
    // y = l*np.cos(theta) + rsh * np.cos(theta + Xi);
    const y = this.getX_Y(theta, l, Xi, rsh, this.math.cos);

    // xy = np.stack((x, y), axis=1);
    const xy = this.math.concat(x, y, 1);

    // sh_angle = this.math.range(0, 1, zsh+1) * 2*np.pi;
    const sh_angle = this.math
      .chain(this.math.range(0, 1, zsh + 1))
      .multiply(this.math.pi)
      .multiply(2)
      .done();
    // S_sh = np.sqrt((rsh + rd) ** 2 - np.power(e * np.sin(zg * sh_angle), 2));
    const S_sh = this.getS(sh_angle, zg, e, rsh, rd);
    // l_Sh = e * np.cos(zg * sh_angle) + S_sh;
    const l_Sh = this.math
      .chain(sh_angle)
      .multiply(zg)
      .map(this.math.cos)
      .multiply(e)
      .add(S_sh)
      .done();
    // x_sh = l_Sh*np.sin(sh_angle);
    const x_sh = this.math
      .chain(sh_angle)
      .map(this.math.sin)
      .multiply(l_Sh)
      .done();
    // y_sh = l_Sh*np.cos(sh_angle);
    const y_sh = this.math
      .chain(sh_angle)
      .map(this.math.cos)
      .multiply(l_Sh)
      .done();
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
    // S = sqrt((rsh + rd) ** 2 - np.power(e * np.sin(zg * theta), 2));
    // S_sh = np.sqrt((rsh + rd) ** 2 - np.power(e * np.sin(zg * sh_angle), 2));
    // Difference between S and S_sh is only `sh_angle` instead of `theta`
    // subtrahend = (rsh + rd) ** 2
    const subtrahend = this.math
      .chain(rsh)
      .add(rd)
      .pow(2)
      .done();
    // subtractor = np.power(e * np.sin(zg * theta), 2)
    const subtractor = this.math
      .chain(theta)
      .multiply(zg)
      .map(this.math.sin)
      .multiply(e)
      .pow(2)
      .done();
    // sqrt(subtrahend - subtractor)
    return this.math
      .chain(subtrahend)
      .subtract(subtractor)
      .pow(0.5)
      .done() as Matrix;
  }

  /**
   * Calculates the Xi matrix using the arctangent of the ratio between a transformed theta matrix and S.
   *
   * Xi is computed as: Xi = arctan2(e * zg * sin(zg * theta), S)
   *
   * @param theta - The input matrix of angular values.
   * @param zg - The gear ratio or multiplier applied to theta.
   * @param e - The eccentricity or scaling factor applied to the result.
   * @param S - The denominator matrix or value for the arctangent calculation.
   * @returns The resulting Xi matrix after applying the arctangent operation.
   */
  private getXi(theta: Matrix, zg: number, e: number, S: MathType): Matrix {
    // Xi = np.arctan2(e*zg*np.sin(zg*theta), S);
    // atanArg = e*zg*np.sin(zg*theta)
    const atanArg = this.math
      .chain(theta)
      .multiply(theta)
      .map(this.math.sin)
      .multiply(zg)
      .multiply(e)
      .done();
    return this.math.atan2(atanArg, S as Matrix);
  }

  /**
   * Calculates the X or Y coordinate based on the provided parameters using matrix operations.
   *
   * The calculation follows the formula:
   *   result = l * func(theta) + rsh * func(theta + Xi)
   *
   * @param theta - A matrix representing the angle(s) theta.
   * @param l - The length or scalar multiplier for the first term.
   * @param Xi - A matrix or value to be added to theta for the second term.
   * @param rsh - The scalar multiplier for the second term.
   * @param func - A function to apply to the angle(s), such as Math.sin or Math.cos.
   * @returns The computed matrix or value representing the coordinate.
   */
  private getX_Y(theta: Matrix, l: MathType, Xi: MathType, rsh: number, func: (value: any) => MathType) {
    // x = l*np.sin(theta) + rsh * np.sin(theta + Xi);
    // termA = l * np.sin(theta)
    const termA = this.math
      .chain(theta)
      .map(func)
      .multiply(l)
      .done();
    // termB = rsh * np.sin(theta + Xi)
    const termB = this.math
      .chain(theta)
      .add(Xi as Matrix)
      .map(func)
      .multiply(rsh)
      .done();
    return this.math.add(termA, termB);
  }
}
