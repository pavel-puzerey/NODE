import { Point } from '../types';

export function calculateDistance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

export function calculateScale(pixelDistance: number, realDistance: number): number {
  return realDistance / pixelDistance; // inches per pixel
}

export function pixelsToInches(pixelDistance: number, scale: number): number {
  return pixelDistance * scale;
}

export function calculateCentroid(points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  
  return {
    x: sumX / points.length,
    y: sumY / points.length
  };
}

export function calculateExtremeSpread(points: Point[], scale: number): number {
  if (points.length < 2) return 0;
  
  let maxDistance = 0;
  
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dist = calculateDistance(points[i], points[j]);
      if (dist > maxDistance) {
        maxDistance = dist;
      }
    }
  }
  
  return pixelsToInches(maxDistance, scale);
}

export function calculateMeanRadius(points: Point[], scale: number): number {
  if (points.length === 0) return 0;
  
  const center = calculateCentroid(points);
  const totalDistance = points.reduce((sum, p) => sum + calculateDistance(p, center), 0);
  
  return pixelsToInches(totalDistance / points.length, scale);
}

export function calculateGroupSize(points: Point[], scale: number): number {
  // Group size is typically the extreme spread for precision shooting
  return calculateExtremeSpread(points, scale);
}