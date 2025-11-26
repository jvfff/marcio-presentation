import React, { useState, useEffect } from 'react';
import { ArrowRight, Play } from 'lucide-react';

const RouteSelector = ({ onCalculate, isLoading }) => {
  const [cidades, setCidades] = useState([]);
  const [origem, setOrigem] = useState('Vassouras');
  const [destino, setDestino] = useState('Volta Redonda');

  // Buscar cidades da API
  useEffect(() => {
    const fetchCidades = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/cidades');
        const data = await response.json();
        setCidades(data.cidades);
      } catch (error) {
        console.error('Erro ao buscar cidades:', error);
        // Fallback para dados locais
        setCidades(['Vassouras', 'Maricá', 'Volta Redonda', 'Três Rios', 'Paty do Alferes']);
      }
    };
    fetchCidades();
  }, []);

  const handleCalcular = () => {
    if (origem !== destino) {
      onCalculate(origem, destino);
    } else {
      alert('⚠️ Origem e destino devem ser diferentes!');
    }
  };

  const destinosValidos = cidades.filter(c => c !== origem);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        🗺️ Seletor de Rotas
      </h3>
      
      <div className="flex flex-col md:flex-row gap-4 items-end">
        {/* Seletor de Origem */}
        <div className="flex-1">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Origem (Saída)
          </label>
          <select
            value={origem}
            onChange={(e) => setOrigem(e.target.value)}
            disabled={isLoading}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
          >
            {cidades.map(cidade => (
              <option key={cidade} value={cidade}>
                {cidade} {cidade === 'Vassouras' ? '🏭 (Armazém)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Ícone de seta */}
        <div className="text-gray-400 text-2xl mb-1 md:mb-0">
          <ArrowRight size={28} />
        </div>

        {/* Seletor de Destino */}
        <div className="flex-1">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Destino (Chegada)
          </label>
          <select
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            disabled={isLoading}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
          >
            {destinosValidos.map(cidade => (
              <option key={cidade} value={cidade}>
                {cidade}
              </option>
            ))}
          </select>
        </div>

        {/* Botão Gerar Grafo */}
        <button
          onClick={handleCalcular}
          disabled={isLoading}
          className={`px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${
            isLoading
              ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
          }`}
        >
          <Play size={18} />
          {isLoading ? 'Calculando...' : 'Gerar Grafo'}
        </button>
      </div>

      {/* Informações da seleção */}
      {origem && destino && origem !== destino && (
        <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
          <p className="text-blue-800 text-sm">
            <strong>Rota selecionada:</strong> {origem} → {destino}
          </p>
        </div>
      )}
    </div>
  );
};

export default RouteSelector;
