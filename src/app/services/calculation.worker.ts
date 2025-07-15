/// <reference lib="webworker" />
import { create, all } from 'mathjs'
import { getL, getL_Sh, getS, getSh_angle, getSh_angleLN, getSh_angleMx, getTheta, getX_sh, getX_Y, getXi, getY_sh, stack } from 'src/app/common/utils/math-utils';

const math = create(all, { number: 'BigNumber' });

addEventListener('message', ({ data }) => {
  if (data.type === 'START CALCULATION') {
    const { taskId, RESOLUTION, params } = data;
    const { zg, rsh, e, rd, zsh } = params;

    let aborted = false;

    // Abort Handler
    const abortHandler = (e: MessageEvent) => {
      if (e.data.type === 'ABORT_CALCULATION' && e.data.taskId === taskId) {
        aborted = true;
        self.postMessage({
          type: 'CALCULATION_ABORTED',
          taskId
        });
        removeEventListener('message', abortHandler);
      }
    };
    addEventListener('message', abortHandler);

    try {
      const progressUpdate = (progress: number, stage: string) => {
        if (aborted) return;
        self.postMessage({
          type: 'PROGRESS_UPDATE',
          taskId,
          progress,
          stage,
        });
      }

      // Initialization
      progressUpdate(1, 'Initialization');

      const theta = getTheta(RESOLUTION);
      progressUpdate(10, 'Theta has been calculated');

      const S = getS(theta, zg, e, rsh, rd);
      progressUpdate(20, 'S has been calculated');

      const l = getL(theta, zg, e, S);
      progressUpdate(30, 'L has been calculated');

      const Xi = getXi(theta, zg, e, S);
      progressUpdate(40, 'Xi has been calculated');

      const x = getX_Y(theta, l, Xi, rsh, 'sin');
      progressUpdate(50, 'x has been calculated');

      const y = getX_Y(theta, l, Xi, rsh, 'cos');
      progressUpdate(60, 'y has been calculated');

      const xy = stack(x, y);
      progressUpdate(70, 'xy has been calculated')

      //==================================================

      const sh_angleLN = getSh_angleLN(zsh);
      progressUpdate(74, 'sh_angleLN has been calculated');
      const sh_angleMx = getSh_angleMx(sh_angleLN);
      progressUpdate(78, 'sh_angleLMxhas been calculated');
      const sh_angle = getSh_angle(sh_angleMx);
      progressUpdate(82, 'sh_angle has been calculated');

      const S_sh = getS(sh_angle, zg, e, rsh, rd);
      progressUpdate(86, 'S_sh has been calculated');
      const l_Sh = getL_Sh(sh_angle,zg, e, S_sh);
      progressUpdate(90, 'l_Sh has been calculated');
      const x_sh = getX_sh(sh_angle, l_Sh);
      progressUpdate(94, 'x_sh has been calculated');
      const y_sh = getY_sh(sh_angle, l_Sh);
      progressUpdate(99, 'y_sh has been calculated');

      // result
      self.postMessage({
        type: 'CALCULATION_COMPLETE',
        taskId,
        result: {
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
        }
      });
    } catch (error: Error | unknown) {
      self.postMessage({
        type: 'CALCULATION_ERROR',
        taskId,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      removeEventListener('message', abortHandler);
    }
  }
});
