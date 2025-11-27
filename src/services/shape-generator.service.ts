
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ShapeGeneratorService {
  /**
   * Generates points for a heart shape using parametric equations.
   * @param count - The number of points to generate.
   * @returns An array of 3D coordinates.
   */
  generateHeart(count: number): [number, number, number][] {
    const points: [number, number, number][] = [];
    const scale = 1.5;
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 2 * Math.PI;
      const u = Math.random() * 2 * Math.PI;

      const x = scale * 16 * Math.pow(Math.sin(t), 3) * Math.cos(u);
      const y = scale * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * Math.cos(u);
      const z = scale * 5 * Math.sin(u) * (1 + Math.sin(t));
      
      points.push([x, y, z]);
    }
    return points;
  }

  /**
   * Generates points for a spherical nebula shape.
   * @param count - The number of points to generate.
   * @returns An array of 3D coordinates.
   */
  generateNebula(count: number): [number, number, number][] {
    const points: [number, number, number][] = [];
    const radius = 25;
    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      
      const r = Math.cbrt(Math.random()) * radius;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      points.push([x, y, z]);
    }
    return points;
  }
}
