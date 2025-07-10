import { Injectable } from '@angular/core';
import { DxfWriter, point2d, LWPolylineVertex, point3d } from '@tarikjabiri/dxf';
import { saveAs } from 'file-saver';

interface WheelProfileConfig {
  BASE_WHEEL_SHAPE: boolean;
  SEPARATOR: boolean;
  ECCENTRIC: boolean;
  BALLS: boolean;
  OUT_DIAMETER: boolean;
  xy: [number, number][];
  Rout: number;
  Rin: number;
  Rsep_out: number;
  Rsep_in: number;
  e: number;
  rd: number;
  zsh: number;
  rsh: number;
  x_sh: number[];
  y_sh: number[];
  D: number;
}

@Injectable({
  providedIn: 'root'
})
export class RenderService {

  constructor() {}

  public generateWheelProfile(config: WheelProfileConfig, fileName: string = 'wheel_profile.dxf'): void {
    const dxf = this.createDxfDocument(config);
    // this.saveDxfFile(dxf, fileName);
  }

  private createDxfDocument(config: WheelProfileConfig): DxfWriter {
    const dxf = new DxfWriter();
    dxf.setVariable('$ACADVER', 'AC1015');

    switch (true) {
      case config.BASE_WHEEL_SHAPE:
        this.addBaseWheelShape(dxf, config);
      case config.SEPARATOR:
        this.addSeparator(dxf, config);
      case config.ECCENTRIC:
        this.addEccentric(dxf, config);
      case config.BALLS:
        this.addBalls(dxf, config);
      // case config.OUT_DIAMETER:
      // this.addOuterDiameter(dxf, config);
      break;
    }

    return dxf;
  }

  private addBaseWheelShape(dxf: DxfWriter, config: WheelProfileConfig): void {
    // Add center point (x, y, z)
    dxf.addPoint(0, 0, 0);

    // Add polyline
    const vertices: LWPolylineVertex[] = config.xy.map((point) => ({ point: point2d(point[0], point[1])}));
    dxf.addLWPolyline(vertices);

    /**
     * Commented circles (like in source)
     * {@link https://codeberg.org/TrashRobotics/BallsWaveGearingGenerator/src/branch/main/calc_vptc.py#:~:text=%23%20msp.add_circle((0,0)%2C%20radius%3DRin) | source}
    */
    // dxf.addCircle(0, 0, 0, config.Rout); // (x, y, z, radius)
    // dxf.addCircle(0, 0, 0, config.Rin);
  }

  private addSeparator(dxf: DxfWriter, config: WheelProfileConfig): void {
    const center = point3d(0, 0);

    dxf.addCircle(center, config.Rsep_out);
    dxf.addCircle(center, config.Rsep_in);
  }

private addEccentric(dxf: DxfWriter, config: WheelProfileConfig): void {
    // Eccentric point (top point)
    dxf.addPoint(0, config.e, 0);

    // Vertical line (eccentric axis)
    dxf.addLWPolyline([
        { point: point2d(0, 0) },
        { point: point2d(0, config.e) }
    ]);

    // Horisontal line (base axis)
    dxf.addLWPolyline([
        { point: point2d(-6, 0) },
        { point: point2d(6, 0) }
    ]);

    // Horisontal line (eccentric axis)
    dxf.addLWPolyline([
        { point: point2d(-3, config.e) },
        { point: point2d(3, config.e) }
    ]);

    dxf.addCircle(point3d(0, config.e), config.rd);
  }

  private addBalls(dxf: DxfWriter, config: WheelProfileConfig): void {
    // Memory optimization for a big number of balls
    const { zsh, x_sh, y_sh, rsh } = config;

    for (let i = 0; i < zsh; i++) {
      const ballCenter = point3d(x_sh[i], y_sh[i]);
      dxf.addCircle(ballCenter, rsh);
    }
  }
}
