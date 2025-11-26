import React, { useMemo } from 'react';
import { Network } from 'lucide-react';
import { cities, roads } from './Data';

const GraphView = ({ failedRoads, calculations, onRoadClick, selectedRoute }) => {
  
  const activeRoads = roads.filter(r => !failedRoads.includes(r.id));

  const shortestPathEdges = useMemo(() => {
    const pathSet = new Set();
    if (!calculations) {
      return pathSet;
    }
    
    // Se temos uma rota selecionada, destaca apenas o caminho para o destino selecionado
    if (selectedRoute && selectedRoute.destino) {
      const destino = selectedRoute.destino;
      if (calculations[destino] && calculations[destino].shortest && calculations[destino].shortest.path) {
        const path = calculations[destino].shortest.path;
        // Cria pares de cidades (origem -> destino)
        for (let i = 0; i < path.length - 1; i++) {
          const from = path[i];
          const to = path[i + 1];
          pathSet.add(`${from} → ${to}`);
          pathSet.add(`${to} → ${from}`); // Grafo é não-direcionado
        }
      }
    } else {
      // Destaca todos os caminhos mais curtos
      Object.values(calculations).forEach(result => {
        if (result.shortest && result.shortest.path) {
          const path = result.shortest.path;
          for (let i = 0; i < path.length - 1; i++) {
            const from = path[i];
            const to = path[i + 1];
            pathSet.add(`${from} → ${to}`);
            pathSet.add(`${to} → ${from}`);
          }
        }
      });
    }
    
    return pathSet;
  }, [calculations, selectedRoute]);

  return (
    <div className="bg-white rounded-lg p-8 shadow-lg">
      <div className="mb-6">
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <Network className="text-blue-600" />
          Rede de Distribuição - Região de Vassouras/RJ
        </h3>
        {selectedRoute && (
          <p className="text-sm text-gray-600 mt-2">
            📍 Rota: <strong>{selectedRoute.origem}</strong> → <strong>{selectedRoute.destino}</strong>
          </p>
        )}
      </div>

      {/* Label de Recálculo */}
      {failedRoads.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
          <p className="text-red-800 font-semibold text-sm">
            🚨 {failedRoads.length} rota(s) falhada(s) - Sistema recalculando melhor caminho alternativo
          </p>
        </div>
      )}
      
      <div className="flex justify-center mb-6">
        <svg width="800" height="650" className="border-2 border-gray-200 rounded bg-gray-50">
        {/* 1. Desenhar estradas ativas (Clicáveis) */}
        {activeRoads.map(road => {
          const start = cities[road.from];
          const end = cities[road.to];
          const midX = (start.x + end.x) / 2;
          const midY = (start.y + end.y) / 2;
          
          // Verifica ambas as direções pois o grafo é não-direcionado
          const pathKey1 = `${road.from} → ${road.to}`;
          const pathKey2 = `${road.to} → ${road.from}`;
          const isShortestPath = shortestPathEdges.has(pathKey1) || shortestPathEdges.has(pathKey2);
          
          const lineColor = isShortestPath ? "#10b981" : "#3b82f6";
          const strokeWidth = isShortestPath ? "5" : "3";

          return (
            <g 
              key={road.id}
              onClick={() => onRoadClick(road.id)}
              style={{ cursor: 'pointer' }}
              className="opacity-100 hover:opacity-80 transition-opacity"
            >
              <line
                x1={start.x} y1={start.y} x2={end.x} y2={end.y}
                stroke={lineColor} strokeWidth={strokeWidth}
                opacity={isShortestPath ? 1 : 0.6}
              />
              <circle cx={midX} cy={midY} r="18" fill="white" stroke={lineColor} strokeWidth="2"/>
              <text x={midX} y={midY + 5} textAnchor="middle" fontSize="12" fontWeight="bold">
                {road.cost}
              </text>
            </g>
          );
        })}

        {/* 2. Desenhar estradas falhas (Clicáveis) */}
        {failedRoads.length > 0 && roads
          .filter(r => failedRoads.includes(r.id))
          .map(road => {
            const start = cities[road.from];
            const end = cities[road.to];
            const midX = (start.x + end.x) / 2;
            const midY = (start.y + end.y) / 2;
            return (
              <g 
                key={road.id + '-failed-group'}
                onClick={() => onRoadClick(road.id)}
                style={{ cursor: 'pointer' }}
                className="opacity-70 hover:opacity-100 transition-opacity"
              >
                <line
                  key={road.id + '-failed-line'}
                  x1={start.x} y1={start.y} x2={end.x} y2={end.y}
                  stroke="#ef4444" strokeWidth="4" strokeDasharray="5,5"
                />
                <circle cx={midX} cy={midY} r="18" fill="white" stroke="#ef4444" strokeWidth="2"/>
                <text 
                  x={midX} y={midY + 5} 
                  textAnchor="middle" fontSize="12" 
                  fontWeight="bold" fill="#ef4444"
                >
                  {road.cost}
                </text>
              </g>
            );
        })}

        {/* 3. Desenhar cidades (Vértices) */}
        {Object.entries(cities).map(([name, pos]) => {
          
          // Verifica se a cidade está inacessível
          let isAccessible = true;
          if (calculations && calculations[name] && calculations[name].shortest === null) {
            isAccessible = false;
          }

          // Define a cor do círculo
          let circleFill;
          if (pos.isWarehouse) {
            circleFill = "#10b981"; // Armazém (Origem) é sempre verde
          } else if (isAccessible) {
            circleFill = "#6366f1"; // Destino acessível é índigo
          } else {
            circleFill = "#ef4444"; // Destino inacessível é vermelho
          }

          return (
            <g key={name}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r="30"
                fill={circleFill}
                stroke="white"
                strokeWidth="3"
              />
              
              {pos.isWarehouse ? (
                <text x={pos.x} y={pos.y - 5} textAnchor="middle" fontSize="20">🏭</text>
              ) : !isAccessible ? (
                 <text x={pos.x} y={pos.y + 8} textAnchor="middle" fontSize="25">⚠️</text>
              ) : null}

              <text
                x={pos.x}
                y={pos.y + 50}
                textAnchor="middle"
                fontSize="14"
                fontWeight="bold"
                fill="#1f2937"
              >
                {name}
              </text>
            </g>
          );
        })}
      </svg>
      </div>

      {/* Informações do Caminho Selecionado */}
      {selectedRoute && calculations && calculations[selectedRoute.destino] && calculations[selectedRoute.destino].shortest && (
        <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
          <h4 className="font-bold text-blue-900 mb-2">✓ Melhor Rota Encontrada</h4>
          <p className="text-blue-800 text-sm mb-3">
            <strong>Caminho:</strong> {calculations[selectedRoute.destino].shortest.path.join(' → ')}
          </p>
          <p className="text-blue-800 text-sm font-bold">
            <strong>Distância Total:</strong> {calculations[selectedRoute.destino].shortest.cost} km
          </p>
        </div>
      )}

      {/* Legenda */}
      <div className="mt-4 flex flex-wrap gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-green-500"></div>
          <span>Armazém (Origem)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-indigo-500"></div>
          <span>Cidade (Acessível)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-xs">⚠️</div>
          <span>Cidade (Inacessível)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-12 h-1 bg-green-500" style={{borderWidth: '2px'}}></div>
          <span>Caminho Mais Curto</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-12 h-1" style={{border: '2px dashed #ef4444'}}></div>
          <span>Estrada (Falha / Clicável)</span>
        </div>
      </div>
    </div>
  );
};

export default GraphView;