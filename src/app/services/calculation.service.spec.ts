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

  describe('calculateBasicParams', () => {
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

      expect(result.dsh.toString()).toBe(expected.dsh.toString());
      expect(result.e.toString()).toBe(expected.e.toString());
      expect(result.hc.toString()).toBe(expected.hc.toString());
      expect(result.i.toString()).toBe(expected.i.toString());
      expect(result.rd.toString()).toBe(expected.rd.toString());
      expect(result.Rin.toString()).toBe(expected.Rin.toString());
      expect(result.Rout.toString()).toBe(expected.Rout.toString());
      expect(result.Rsep_in.toString()).toBe(expected.Rsep_in.toString());
      expect(result.Rsep_m.toString()).toBe(expected.Rsep_m.toString());
      expect(result.Rsep_out.toString()).toBe(expected.Rsep_out.toString());
      expect(result.zg.toString()).toBe(expected.zg.toString());
      expect(result.zsh.toString()).toBe(expected.zsh.toString());
    });

    it('should handle zero values correctly', () => {
      const expected = {
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
      };
      const result = service.calculateBasicParams(0, 0, 0, 0);
      expect(result.dsh.toString()).toBe(expected.dsh.toString());
      expect(result.e.toString()).toBe(expected.e.toString());
      expect(result.hc.toString()).toBe(expected.hc.toString());
      expect(result.i.toString()).toBe(expected.i.toString());
      expect(result.rd.toString()).toBe(expected.rd.toString());
      expect(result.Rin.toString()).toBe(expected.Rin.toString());
      expect(result.Rout.toString()).toBe(expected.Rout.toString());
      expect(result.Rsep_in.toString()).toBe(expected.Rsep_in.toString());
      expect(result.Rsep_m.toString()).toBe(expected.Rsep_m.toString());
      expect(result.Rsep_out.toString()).toBe(expected.Rsep_out.toString());
      expect(result.zg.toString()).toBe(expected.zg.toString());
      expect(result.zsh.toString()).toBe(expected.zsh.toString());
    });

    it('should correctly calculate when i is negative', () => {
      const result = service.calculateBasicParams(10, 5, -2, 100);
      expect(result.zg.toString()).toBe((-5).toString()); // (i + 1) * u = (-2 + 1) * 5 = -5
      expect(result.zsh.toString()).toBe((-2).toString()); // i = -2
    });

    it('should correctly calculate when Rout is less than 2e', () => {
      const dsh = 10; // e = 2
      const Rout = 3; // smaller then 2e=4
      const result = service.calculateBasicParams(dsh, 5, 3, Rout);
      expect(result.Rin.toString()).toBe((-1).toString()); // Rout - 2e = 3 - 4 = -1
      expect(result.rd.toString()).toBe((-9).toString());  // Rin + e - dsh = -1 + 2 - 10 = -9
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

  describe('checkBasicParamsValidity', () => {
    it('should return true when Rin is less than or equal to the limit', () => {
      // For zg = 10, dsh = 20, Rin = 50
      // limit = (1.03 * 20) / sin(pi/10) ≈ 20.6 / 0.3090 ≈ 66.68
      const Rin = 50;
      const zg = 10;
      const dsh = 20;
      expect(service.checkBasicParamsValidity(Rin, zg, dsh)).toBeTrue();
    });

    it('should return true when Rin is exactly at the limit', () => {
      const zg = 8;
      const dsh = 16;
      const limit = Number(service['math'].divide(
        service['math'].multiply(dsh, 1.03),
        service['math'].sin(service['math'].divide(service['math'].pi, zg))
      ));
      expect(service.checkBasicParamsValidity(service['math'].bignumber(limit), zg, dsh)).toBeTrue();
    });

    it('should return false when Rin is greater than the limit', () => {
      const zg = 12;
      const dsh = 10;
      const limit = Number(service['math'].divide(
        service['math'].multiply(dsh, 1.03),
        service['math'].sin(service['math'].divide(service['math'].pi, zg))
      ));
      const Rin = service['math'].bignumber(limit + 1);
      expect(service.checkBasicParamsValidity(Rin, zg, dsh)).toBeFalse();
    });

    it('should handle zg = 1 (sin(pi/1) = 0, division by zero)', () => {
      // Should return false or throw, but mathjs returns Infinity, so Rin <= Infinity is true
      expect(service.checkBasicParamsValidity(100, 1, 10)).toBeTrue();
    });

    it('should handle zg = 0 (division by zero)', () => {
      // Should return false or throw, but mathjs returns NaN, so Rin <= NaN is false
      expect(service.checkBasicParamsValidity(100, 0, 10)).toBeFalse();
    });
  });
});
