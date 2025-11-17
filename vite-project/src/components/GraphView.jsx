import React, { useMemo } from 'react';
import { Network } from 'lucide-react';
import { cities, roads } from './Data';

const GraphView = ({ failedRoads, calculations, onRoadClick }) => {
  
  const activeRoads = roads.filter(r => !failedRoads.includes(r.id));

  const shortestPathEdges = useMemo(() => {
    // (Lógica do useMemo para destacar caminhos - sem mudança)
    const pathSet = new Set();
    if (!calculations) {
      return pathSet;
    }
    Object.values(calculations).forEach(result => {
      if (result.shortest && result.shortest.path) {
        result.shortest.path.forEach(segment => {
          const citiesOnly = segment.substring(0, segment.indexOf('(')).trim();
          pathSet.add(citiesOnly); 
        });
      }
    });
    return pathSet;
  }, [calculations]);

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Network className="text-blue-600" />
        Rede de Distribuição - Região de Vassouras/RJ
      </h3>
      
      <svg width="600" height="500" className="border-2 border-gray-200 rounded">
        {/* 1. Desenhar estradas ativas (Clicáveis) */}
        {activeRoads.map(road => {
          // (Lógica das estradas ativas - sem mudança)
          const start = cities[road.from];
          const end = cities[road.to];
          const midX = (start.x + end.x) / 2;
          const midY = (start.y + end.y) / 2;
          const pathKey = `${road.from} → ${road.to}`;
          const isShortestPath = shortestPathEdges.has(pathKey);
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
            // (Lógica das estradas falhas - sem mudança)
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

        {/* 3. 💡 LÓGICA ATUALIZADA: Desenhar cidades (Vértices) */}
        {Object.entries(cities).map(([name, pos]) => {
          
          // Verifica se a cidade está inacessível
          let isAccessible = true;
          // O 'calculations' pode ser nulo na primeira renderização
          // E verificamos se 'shortest' é nulo para aquele destino
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
                fill={circleFill} // Cor dinâmica
                stroke="white"
                strokeWidth="3"
              />
              
              {/* Renderiza o ícone de Armazém OU o ícone de Atenção */}
              {pos.isWarehouse ? (
                <text x={pos.x} y={pos.y - 5} textAnchor="middle" fontSize="20">🏭</text>
              ) : !isAccessible ? (
                 // Adiciona o ícone de atenção se não for acessível
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

      {/* Legenda (Atualizada para incluir a cidade inacessível) */}
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