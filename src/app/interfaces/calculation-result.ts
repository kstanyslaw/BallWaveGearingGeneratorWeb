import { MathType, Matrix } from "mathjs";

export interface CalculationResult {
  theta: Matrix;
  S: Matrix;
  l: Matrix;
  x: Matrix;
  y: Matrix;
  xy: Matrix;
  sh_angle: Matrix;
  S_sh: MathType;
  l_Sh: MathType;
  x_sh: Matrix;
  y_sh: Matrix;
}
