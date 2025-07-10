import { Injectable } from '@angular/core';
import { DxfWriter, point2d, LWPolylineVertex } from '@tarikjabiri/dxf';
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
  D: number;
}

@Injectable({
  providedIn: 'root'
})
export class RenderService {

  constructor() {}

  public generateWheelProfile(config: WheelProfileConfig, fileName: string = 'wheel_profile.dxf'): void {
    // const dxf = this.createDxfDocument(config);
    // this.saveDxfFile(dxf, fileName);
  }

}
