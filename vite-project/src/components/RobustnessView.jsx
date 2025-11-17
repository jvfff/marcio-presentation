import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { roads } from './Data';

const RobustnessView = ({ calculations, calculateAllPaths }) => {
  if (!calculations) return <div>Calculando...</div>;

  const criticalRoads = roads.map(road => {
    const affected = Object.entries(calculations).filter(([dest, data]) => {
      const pathsWithoutRoad = calculateAllPaths('Vassouras', dest, road.id);
      return pathsWithoutRoad.length === 0 || 
             (data.shortest && pathsWithoutRoad[0]?.cost > data.shortest.cost * 1.5);
    });
    return { road, affected: affected.length };
  }).sort((a, b) => b.affected - a.affected);

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <AlertTriangle className="text-yellow-600" />
        Análise de Robustez da Rede
      </h3>

      <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
        <h4 className="font-bold mb-3">Estradas Críticas (por ordem de importância):</h4>
        {criticalRoads.map((item, idx) => (
          <div key={item.road.id} className="mb-2 p-3 bg-white rounded border-l-4" 
               style={{borderColor: idx === 0 ? '#ef4444' : idx === 1 ? '#f97316' : '#eab308'}}>
            <p className="font-semibold">
              {idx + 1}. {item.road.from} ↔ {item.road.to} ({item.road.cost} km)
            </p>
            <p className="text-sm text-gray-600">
              {item.affected > 0 
                ? `Impacta ${item.affected} destino(s) significativamente`
                : 'Possui rotas alternativas eficientes'}
            </p>
          </div>
        ))}
      </div>

      <div className="p-4 bg-blue-50 rounded-lg">
        <h4 className="font-bold mb-2">Recomendações:</h4>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>Priorizar manutenção das 3 estradas mais críticas</li>
          <li>Considerar construção de estradas redundantes para cidades isoláveis</li>
          <li>Manter equipes de emergência nas rotas de maior tráfego</li>
          <li>Implementar sistema de monitoramento em tempo real</li>
        </ul>
      </div>
    </div>
  );
};

export default RobustnessView;