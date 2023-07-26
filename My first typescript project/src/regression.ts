
function linreg(...args: Renderable[]) {
    if (args.length == 0) throw "breh";
  
    if (args.length === 1) {
      const b = args[0].y;
      return (x: number) => b;
    } else {
      const n = args.length;
      let sumX = 0;
      let sumY = 0;
      let sumXY = 0;
      let sumXX = 0;
  
      for (const point of args) {
        sumX += point.x;
        sumY += point.y;
        sumXY += point.x * point.y;
        sumXX += point.x * point.x;
      }
  
      const a =
        (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const b = (sumY - a * sumX) / n;
  
      return (x: number) => a * x + b;
    }
  }