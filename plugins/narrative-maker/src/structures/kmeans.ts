interface Point {
    x: number;
    y: number;
  }
  
  export function kMeansClustering(data: Point[], k: number, maxIteratons: number): Point[] {
    // Step 1: Initialize centroids
    let centroids: Point[] = [];
    for (let i = 0; i < k; i++) {
      centroids.push(data[Math.floor(Math.random() * data.length)]);
    }
  
    let prevCentroids: Point[] = [];
    let iterations = 0;
  
    while (!areCentroidsEqual(centroids, prevCentroids) && iterations++ < maxIteratons) {
      // Step 2: Assign data points to the nearest centroid
      const clusters: Point[][] = Array.from({ length: k }, () => []);
  
      for (const point of data) {
        const nearestCentroid = findNearestCentroid(point, centroids);
        clusters[nearestCentroid].push(point);
      }
  
      // Step 3: Recalculate centroids
      prevCentroids = [...centroids];
      centroids = clusters.map(calculateCentroid);
    }
  
    return centroids;
  }
  
  function areCentroidsEqual(centroids1: Point[], centroids2: Point[]): boolean {
    if (centroids1.length !== centroids2.length) {
      return false;
    }
  
    for (let i = 0; i < centroids1.length; i++) {
      if (centroids1[i].x !== centroids2[i].x || centroids1[i].y !== centroids2[i].y) {
        return false;
      }
    }
  
    return true;
  }
  
  function findNearestCentroid(point: Point, centroids: Point[]): number {
    let nearestCentroidIndex = 0;
    let nearestDistance = distance(point, centroids[0]);
  
    for (let i = 1; i < centroids.length; i++) {
      const distanceToCentroid = distance(point, centroids[i]);
      if (distanceToCentroid < nearestDistance) {
        nearestCentroidIndex = i;
        nearestDistance = distanceToCentroid;
      }
    }
  
    return nearestCentroidIndex;
  }
  
  function calculateCentroid(points: Point[]): Point {
    const sumX = points.reduce((sum, point) => sum + point.x, 0);
    const sumY = points.reduce((sum, point) => sum + point.y, 0);
    const centroidX = sumX / points.length;
    const centroidY = sumY / points.length;
    return { x: centroidX, y: centroidY };
  }
  
  function distance(point1: Point, point2: Point): number {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  