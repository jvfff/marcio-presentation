export const cities = {
  'Vassouras': { x: 200, y: 200, isWarehouse: true },
  'Maricá': { x: 500, y: 100 },
  'Volta Redonda': { x: 100, y: 350 },
  'Três Rios': { x: 350, y: 300 },
  'Paty do Alferes': { x: 250, y: 400 }
};

export const roads = [
  { from: 'Vassouras', to: 'Maricá', cost: 85, id: 'r1' },
  { from: 'Vassouras', to: 'Três Rios', cost: 45, id: 'r2' },
  { from: 'Vassouras', to: 'Paty do Alferes', cost: 30, id: 'r3' },
  { from: 'Maricá', to: 'Três Rios', cost: 65, id: 'r4' },
  { from: 'Três Rios', to: 'Volta Redonda', cost: 50, id: 'r5' },
  { from: 'Paty do Alferes', to: 'Volta Redonda', cost: 40, id: 'r6' },
  { from: 'Três Rios', to: 'Paty do Alferes', cost: 35, id: 'r7' }
];