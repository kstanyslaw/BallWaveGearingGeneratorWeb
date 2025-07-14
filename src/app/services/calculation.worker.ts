/// <reference lib="webworker" />
import { create, all } from 'mathjs'

const math = create(all, { number: 'BigNumber' });

addEventListener('message', ({ data }) => {
  if (data.type === 'START CALCULATION') {
    const { taskId, RESOLUTION, params } = data;
    const { zg, rsh, e, rd, zsh } = params;

    let aborted = false;

    // Abort Handler
    const abortHandler = (e: MessageEvent) => { };
    addEventListener('message', abortHandler);

    try {

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
