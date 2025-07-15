import { all, bignumber, BigNumber, create, MathType, Matrix } from "mathjs";

export const math = create(all, { number: 'BigNumber' });

export const linspace = (start: number, end: number, count: number): number[] | BigNumber[] => {
  if (count < 2) {
      return [start];
  }
  const step = math
    .chain(end)
    .subtract(start)
    .divide(
      math.subtract(count, 1)
    )
    .done();

  return Array.from({ length: count }, (_, i) =>
    math
      .chain(step)
      .multiply(i)
      .add(start)
      .done()
  );
}

export const stack = (x: Matrix, y: Matrix): Matrix => {
  const xSize = x.size();
  const ySize = y.size();
  if(xSize.length !== ySize.length) {
    throw new Error('IndexError: size of X and Y should be the same while stack!');
  }
  const length = xSize[0] > ySize[0] ? xSize[0] : ySize[0];
  const resultArr = [];
  for(let i = 0; i < length; i++) {
    resultArr.push([ x.get([i]) ?? 0, y.get([i]) ?? 0 ]);
  }
  return math.matrix(resultArr);
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
export const getS = (theta: Matrix, zg: number, e: number, rsh: number, rd: number): MathType => {
  // S = sqrt((rsh + rd) ** 2 - np.power(e * np.sin(zg * theta), 2));
  // S_sh = np.sqrt((rsh + rd) ** 2 - np.power(e * np.sin(zg * sh_angle), 2));
  // Difference between S and S_sh is only `sh_angle` instead of `theta`
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
    .map(math.square)
    .done();
  // sqrt(subtrahend - subtractor)
  return math
    .chain(subtractor)
    .map(val => math.subtract(subtrahend, val))
    .map(math.sqrt)
    .done();
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
export const getXi = (theta: Matrix, zg: number, e: number, S: MathType): Matrix => {
  // Xi = np.arctan2(e*zg*np.sin(zg*theta), S);
  // atanArg = e*zg*np.sin(zg*theta)
  const atanArg = math
    .chain(theta)
    .multiply(zg)
    .map(math.sin)
    .multiply(zg)
    .multiply(e)
    .done();
  return math.atan2(atanArg, S as Matrix);
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
export const getX_Y = (theta: Matrix, l: Matrix, Xi: Matrix, rsh: number, tFuncName: 'sin' | 'cos') => {
  const func = tFuncName === 'sin' ? math.sin : math.cos;
  // x = l*np.sin(theta) + rsh * np.sin(theta + Xi);
  // termA = l * np.sin(theta)
  const funcTheta = math.map(theta, func);
  const termA = math.dotMultiply(l, funcTheta);
  // termB = rsh * np.sin(theta + Xi)
  const thetaXi = math.add(theta, Xi);
  const termB = math
    .chain(thetaXi)
    .map(func)
    .multiply(rsh)
    .done();
  return math.add(termA, termB);
}

export const getTheta = (RESOLUTION: number): Matrix => {
  const thetaArray = linspace(0, math.multiply(2, math.pi), RESOLUTION);
  return math.matrix(thetaArray);
}

export const getL = (theta: Matrix, zg: number, e: number, S: MathType): Matrix => {
  return math
    .chain(theta)
    .multiply(zg)
    .map(math.cos)
    .multiply(e)
    .add(S)
    .done() as Matrix;
}

export const getSh_angleLN = (zsh: number): number[] | BigNumber[] => linspace(0, 1, +math.add(zsh, 1).toFixed(0));

export const getSh_angleMx = (sh_angleLN: number[] | BigNumber[]): Matrix => math.matrix(sh_angleLN).map(bignumber);

export const getSh_angle = (sh_angleMx: Matrix): Matrix => math
  .chain(sh_angleMx)
  .multiply(math.pi)
  .multiply(2)
  .done();

export const getL_Sh = (sh_angle: Matrix, zg: number, e: number, S_sh: MathType): MathType => math
  .chain(sh_angle)
  .multiply(zg)
  .map(math.cos)
  .multiply(e)
  .add(S_sh)
  .done();

export const getX_sh = (sh_angle: Matrix, l_Sh: MathType) => math
  .chain(sh_angle)
  .map(math.sin)
  .dotMultiply(l_Sh)
  .done();

export const getY_sh = (sh_angle: Matrix, l_Sh: MathType) => math
  .chain(sh_angle)
  .map(math.cos)
  .dotMultiply(l_Sh)
  .done();
