import { TestBed } from '@angular/core/testing';
import { CalculationService } from './calculation.service';
import { BasicParams } from '../interfaces/basic-params';

describe('CalculationService', () => {
  let service: CalculationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CalculationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  fdescribe('service.calculateBasicParams', () => {
    it('should correctly calculate all parameters for basic input', () => {
      const dsh = 10;
      const u = 5;
      const i = 3;
      const Rout = 100;

      const expected: BasicParams = {
        dsh: 10,
        e: 2,          // 0.2 * dsh = 0.2 * 10 = 2
        hc: 4.4,        // 2.2 * e = 2.2 * 2 = 4.4
        i: 3,
        rd: 88,         // Rin + e - dsh = (Rout - 2*e) + e - dsh = (100-4)+2-10=88
        Rin: 96,        // Rout - 2*e = 100 - 4 = 96
        Rout: 100,
        Rsep_in: 90.8,  // Rsep_m - hc/2 = 96 - 2.2 = 93.8
        Rsep_m: 93,     // rd + rsh = 92 + 4 = 96 (but rsh = dsh/2 = 5?)
        Rsep_out: 95.2, // Rsep_m + hc/2 = 96 + 2.2 = 98.2
        zg: 20,         // (i + 1) * u = 4 * 5 = 20
        zsh: 3,         // i = 3
      };

      const result = service.calculateBasicParams(dsh, u, i, Rout);

      expect(result).toEqual(expected);
    });

    it('should handle zero values correctly', () => {
      const result = service.calculateBasicParams(0, 0, 0, 0);
      expect(result).toEqual({
        dsh: 0,
        e: 0,
        hc: 0,
        i: 0,
        rd: 0,
        Rin: 0,
        Rout: 0,
        Rsep_in: 0,
        Rsep_m: 0,
        Rsep_out: 0,
        zg: 0,
        zsh: 0,
      });
    });

    it('should correctly calculate when i is negative', () => {
      const result = service.calculateBasicParams(10, 5, -2, 100);
      expect(result.zg).toBe(-5); // (i + 1) * u = (-2 + 1) * 5 = -5
      expect(result.zsh).toBe(-2); // i = -2
    });

    it('should correctly calculate when Rout is less than 2e', () => {
      const dsh = 10; // e = 2
      const Rout = 3; // smaller then 2e=4
      const result = service.calculateBasicParams(dsh, 5, 3, Rout);
      expect(result.Rin).toBe(-1); // Rout - 2e = 3 - 4 = -1
      expect(result.rd).toBe(-9);  // Rin + e - dsh = -1 + 2 - 10 = -9
    });

    it('should handle floating point values correctly', () => {
      const dsh = 7.5;
      const u = 3.2;
      const i = 2;
      const Rout = 50.5;

      const result = service.calculateBasicParams(dsh, u, i, Rout);

      expect(result.e).toBeCloseTo(1.5); // 0.2 * 7.5
      expect(result.zg).toBeCloseTo(9.6); // (2 + 1) * 3.2
      expect(result.Rin).toBeCloseTo(47.5); // 50.5 - 2*1.5
      expect(result.rd).toBeCloseTo(41.5); // 47.5 + 1.5 - 7.5
    });
  });
});
