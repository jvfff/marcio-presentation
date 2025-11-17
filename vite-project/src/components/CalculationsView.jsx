import React from 'react';
import { BarChart3 } from 'lucide-react';

const CalculationsView = ({ calculations }) => {
  if (!calculations) return <div>Calculando...</div>;

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <BarChart3 className="text-blue-600" />
        Cálculo Manual de Caminhos Mínimos
      </h3>

      {Object.entries(calculations).map(([dest, data]) => (
        <div key={dest} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-bold text-lg mb-3 text-indigo-600">
            Vassouras → {dest}
          </h4>

          {data.shortest ? (
            <>
              <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-3">
                <p className="font-semibold text-green-800 mb-2">✓ Caminho Mais Curto:</p>
                <p className="text-sm mb-1">{data.shortest.path.join(' → ')}</p>
                <p className="font-bold text-green-700">Custo Total: {data.shortest.cost} km</p>
              </div>

              {data.alternatives.length > 0 && (
                <div className="bg-blue-50 p-3 rounded">
                  <p className="font-semibold text-blue-800 mb-2">Rotas Alternativas:</p>
                  {data.alternatives.map((alt, idx) => (
                    <div key={idx} className="text-sm mb-2 pl-2 border-l-2 border-blue-300">
                      <p>{alt.path.join(' → ')}</p>
                      <p className="font-semibold">Custo: {alt.cost} km (+{alt.cost - data.shortest.cost} km)</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="bg-red-50 border-l-4 border-red-500 p-3">
              <p className="text-red-800 font-semibold">✗ Nenhuma rota disponível!</p>
              <p className="text-sm text-red-600">Esta cidade ficou isolada devido à falha na estrada.</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CalculationsView;