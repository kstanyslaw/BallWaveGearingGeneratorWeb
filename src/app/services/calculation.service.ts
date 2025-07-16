import { Injectable } from '@angular/core';
import { BasicParams } from '../interfaces/basic-params';
import { create, all, Matrix, MathType, MathJsInstance, BigNumber, bignumber, typeOf } from 'mathjs'
import { Observable, ReplaySubject, Subject } from 'rxjs';
import {getL, getL_Sh, getS, getSh_angle, getSh_angleLN, getSh_angleMx, getTheta, getX_sh, getX_Y, getXi, getY_sh, linspace, math, stack} from 'src/app/common/utils/math-utils';

@Injectable({
  providedIn: 'root'
})
export class CalculationService {
  private math: MathJsInstance;
  private worker: Worker | null = null;
  private progressSubject = new Subject<any>();
  private resultSubject = new ReplaySubject<any>(1);
  private currentTaskId: string | null = null;

  constructor() {
    this.math = math;

     if (typeof Worker !== 'undefined') {
      this.worker = new Worker(
        new URL('./calculation.worker', import.meta.url),
        { type: 'module', name: 'calculation-worker' }
      );

      this.worker.onmessage = ({ data }) => {
        switch (data.type) {
          case 'PROGRESS_UPDATE':
            this.progressSubject.next(data);
            break;
          case 'CALCULATION_COMPLETE':
            this.resultSubject.next(data.result);
            this.cleanup();
            break;
          case 'CALCULATION_ABORTED':
            this.resultSubject.error('Вычисления прерваны');
            this.cleanup();
            break;
          case 'CALCULATION_ERROR':
            this.resultSubject.error(data.error);
            this.cleanup();
            break;
        }
      };
    }
  }


  /**
   * Start calculation with progress and abort hadling
   */
  public calculateWithProgress(
    RESOLUTION: number,
    zg: number,
    rsh: number,
    e: number,
    rd: number,
    zsh: number
  ): { progress$: Observable<any>, result$: Observable<any> } {

    // Abort previous calculation
    if (this.currentTaskId) {
      this.abortCalculation();
    }

    this.currentTaskId = this.generateTaskId();

    if (this.worker) {
      // Start in worker
      this.worker.postMessage({
        type: 'START_CALCULATION',
        taskId: this.currentTaskId,
        RESOLUTION,
        params: { zg, rsh, e, rd, zsh }
      });

      this.worker.onmessage = ({ data }) => {
        if (data.type === 'PROGRESS_UPDATE') {
          this.progressSubject.next(data);
        } else if (data.type === 'CALCULATION_COMPLETE') {
          this.resultSubject.next(data.result);
          this.resultSubject.complete();
        }
      };
    } else {
      // Fallback: execute in main flow
      setTimeout(() => {
        try {
          const result = this.calculateAdditionalParams(
            RESOLUTION, zg, rsh, e, rd, zsh
          );
          this.progressSubject.next({ progress: 100, stage: 'COMPLETE' });
          this.resultSubject.next(result);
        } catch (error) {
          this.resultSubject.error(error instanceof Error ? error.message : String(error));
        }
      });
    }

    return {
      progress$: this.progressSubject.asObservable(),
      result$: this.resultSubject.asObservable()
    };
  }

  /**
   * Abort current calculation
   */
  public abortCalculation() {
    if (this.worker && this.currentTaskId) {
      this.worker.postMessage({
        type: 'ABORT_CALCULATION',
        taskId: this.currentTaskId
      });
    }
    this.cleanup();
  }

  private generateTaskId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }

  private cleanup() {
    this.currentTaskId = null;
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
    const theta = getTheta(RESOLUTION);

    // S = sqrt((rsh + rd) ** 2 - np.power(e * np.sin(zg * theta), 2));
    const S = getS(theta, zg, e, rsh, rd);
    // l = e * np.cos(zg * theta) + S;
    const l = getL(theta, zg, e, S);
    // Xi = np.arctan2(e*zg*np.sin(zg*theta), S);
    const Xi = getXi(theta, zg, e, S);

    // x = l*np.sin(theta) + rsh * np.sin(theta + Xi);
    const x = getX_Y(theta, l, Xi, rsh, 'sin');
    // y = l*np.cos(theta) + rsh * np.cos(theta + Xi);
    const y = getX_Y(theta, l, Xi, rsh, 'cos');

    // xy = np.stack((x, y), axis=1);
    const xy = stack(x, y);

    // sh_angle = np.linspace(0, 1, zsh+1) * 2*np.pi
    const sh_angleLN = getSh_angleLN(zsh);
    const sh_angleMx = getSh_angleMx(sh_angleLN);
    const sh_angle = getSh_angle(sh_angleMx);

    // S_sh = np.sqrt((rsh + rd) ** 2 - np.power(e * np.sin(zg * sh_angle), 2));
    const S_sh = getS(sh_angle, zg, e, rsh, rd);
    // l_Sh = e * np.cos(zg * sh_angle) + S_sh;
    const l_Sh = getL_Sh(sh_angle,zg, e, S_sh);
    // x_sh = l_Sh*np.sin(sh_angle);
    const x_sh = getX_sh(sh_angle, l_Sh);
    // y_sh = l_Sh*np.cos(sh_angle);
    const y_sh = getY_sh(sh_angle, l_Sh);

    return {
      theta,
      S,
      l,
      Xi,
      x,
      y,
      xy,
      sh_angle,
      S_sh,
      l_Sh,
      x_sh,
      y_sh
    };
  }

  public convertMatrixToArray(m: Matrix) {
    const arr = m.toArray();
    return this.convertDecimalToNumberInArray(arr);
  }

  private convertDecimalToNumberInArray(
    arr: Array<any>,
    precision = 6
  ): Array<number> | Array<any> {
    return arr.map(el => {
      const type = typeOf(el);
      switch (type) {
        case 'Array':
          return this.convertDecimalToNumberInArray(el);

        case 'BigNumber':
        case 'Fraction':
          return parseFloat(el.toFixed(precision));

        case 'number':
          return el;

        default:
          try {
            const elInNUmber = parseFloat(el);
            return elInNUmber;
          } catch (error) {
            throw error;
          }
      }
    });
  }
}
