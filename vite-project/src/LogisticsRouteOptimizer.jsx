import React, { useState, useEffect, useCallback } from 'react';
import { Truck, AlertTriangle, CheckCircle } from 'lucide-react';

import { cities, roads } from './components/Data';
import GraphView from './components/GraphView';
import CalculationsView from './components/CalculationsView';
import RobustnessView from './components/RobustnessView';
import PythonCodeView from './components/PythonCodeView';
import RouteSelector from './components/RouteSelector';

const StatusDisplay = ({ status, failedCount }) => {
  if (status === 'calculating') {
    return (
      <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
        <p className="text-yellow-800 font-semibold flex items-center gap-2">
          <AlertTriangle className="animate-spin" size={18} />
          ⚠️ Rota(s) bloqueada(s)! Calculando rotas alternativas...
        </p>
      </div>
    );
  }
  
  if (status === 'recalculated') {
    return (
      <div className="mt-3 p-3 bg-green-50 border-l-4 border-green-500 rounded">
        <p className="text-green-800 font-semibold flex items-center gap-2">
          <CheckCircle size={18} />
          ✅ Rota recalculada! ({failedCount} falha(s) ativa(s)).
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
      <p className="text-blue-800 font-semibold">
        Sistema pronto. Clique em uma rota no gráfico ou nos botões para simular falhas.
      </p>
    </div>
  );
};


const LogisticsRouteOptimizer = () => {
  const [activeTab, setActiveTab] = useState('grafo');
  const [failedRoads, setFailedRoads] = useState([]); 
  const [calculations, setCalculations] = useState(null);
  const [appStatus, setAppStatus] = useState('ready');
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [isLoadingFromAPI, setIsLoadingFromAPI] = useState(false);

  // Função para chamar a API Python
  const handleCalcularRotaAPI = useCallback(async (origem, destino, failedRoadsParam = null) => {
    setIsLoadingFromAPI(true);
    try {
      // Usar failedRoads passado como parâmetro ou o do state
      const roadsToExclude = failedRoadsParam !== null ? failedRoadsParam : failedRoads;
      
      const response = await fetch('http://localhost:5000/api/calcular-rotas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origem: origem,
          excluir_arestas: roadsToExclude.map(id => {
            const road = roads.find(r => r.id === id);
            if (road) {
              return `${road.from}-${road.to}`;
            }
            return '';
          }).filter(e => e)
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setCalculations(data.calculos);
        setSelectedRoute({ origem, destino });
        setAppStatus('ready');
      } else {
        console.error('Erro na resposta da API');
        alert('❌ Erro ao conectar à API. Verifique se o servidor Flask está rodando em http://localhost:5000');
      }
    } catch (error) {
      console.error('Erro ao chamar API:', error);
      alert('❌ Erro ao conectar à API. Verifique se o servidor Flask está rodando em http://localhost:5000');
    } finally {
      setIsLoadingFromAPI(false);
    }
  }, [failedRoads]);

  const calculateAllPaths = useCallback((start, end, excludedRoads = []) => {
    const paths = [];
    const visited = new Set();
    
    const availableRoads = roads.filter(r => !excludedRoads.includes(r.id));

    function dfs(current, target, path, cost) {
      if (current === target) {
        paths.push({ path: [...path], cost });
        return;
      }
      visited.add(current);

      for (const road of availableRoads) {
        let nextCity = null;
        let roadCost = road.cost;

        if (road.from === current && !visited.has(road.to)) {
          nextCity = road.to;
        } 
        else if (road.to === current && !visited.has(road.from)) {
          nextCity = road.from;
        }

        if (nextCity) {
          path.push(`${current} → ${nextCity} (${roadCost}km)`);
          dfs(nextCity, target, path, cost + roadCost);
          path.pop();
        }
      }
      visited.delete(current);
    }
    dfs(start, end, [], 0);
    return paths;
  }, []);


  useEffect(() => {
    const allDestinations = Object.keys(cities).filter(c => c !== 'Vassouras');
    const results = {};

    allDestinations.forEach(dest => {
      const paths = calculateAllPaths('Vassouras', dest, failedRoads); 
      if (paths.length > 0) {
        paths.sort((a, b) => a.cost - b.cost);
        results[dest] = {
          shortest: paths[0],
          alternatives: paths.slice(1, 3),
          allPaths: paths
        };
      } else {
        results[dest] = { shortest: null, alternatives: [], allPaths: [] };
      }
    });

    setCalculations(results);

    if (failedRoads.length > 0) {
      setAppStatus('recalculated');
    } else {
      setAppStatus('ready');
    }
    
  }, [failedRoads, calculateAllPaths]);


  const handleRoadClick = (roadId) => {
    setAppStatus('calculating'); 
    setFailedRoads(currentFailedRoads => {
      const isAlreadyFailed = currentFailedRoads.includes(roadId);
      let newFailedRoads;
      
      if (isAlreadyFailed) {
        // Remover falha
        newFailedRoads = currentFailedRoads.filter(id => id !== roadId);
      } else {
        // Adicionar falha
        newFailedRoads = [...currentFailedRoads, roadId];
      }
      
      // Se há uma rota selecionada, recalcular automaticamente
      if (selectedRoute && selectedRoute.origem) {
        // Fazer o recalcular com os failedRoads atualizados
        setTimeout(() => {
          handleCalcularRotaAPI(selectedRoute.origem, selectedRoute.destino, newFailedRoads);
        }, 0);
      }
      
      return newFailedRoads;
    });
  };

  const handleReset = () => {
    setFailedRoads([]); 
    setAppStatus('ready'); 
  };
  
  const tabClasses = (tabName) => 
    `py-3 px-6 font-semibold transition-colors duration-200 ${
      activeTab === tabName
        ? 'border-b-4 border-blue-600 text-blue-600'
        : 'text-gray-600 hover:text-gray-800'
    }`;


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <Truck className="text-blue-600" size={36} />
            Sistema de Otimização de Rotas Logísticas
          </h1>
          <p className="text-gray-600">
            Análise e Complexidade de Algoritmos - Prof. Márcio Garrido
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Universidade de Vassouras - Engenharia de Software
          </p>
          <StatusDisplay status={appStatus} failedCount={failedRoads.length} />
        </div>

        {/* Seletor de Rotas - Nova Seção */}
        <RouteSelector 
          onCalculate={handleCalcularRotaAPI}
          isLoading={isLoadingFromAPI}
        />

        <div className="bg-white rounded-lg shadow-lg mb-4">
          <div className="flex border-b">
            <button onClick={() => setActiveTab('grafo')} className={tabClasses('grafo')}>
              Visualização do Grafo
            </button>
            <button onClick={() => setActiveTab('calculos')} className={tabClasses('calculos')}>
              Cálculos Manuais
            </button>
            <button onClick={() => setActiveTab('robustez')} className={tabClasses('robustez')}>
              Análise de Robustez
            </button>
            <button onClick={() => setActiveTab('codigo')} className={tabClasses('codigo')}>
              Código Python
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <AlertTriangle className="text-orange-500" />
            Simulador de Falhas em Estradas
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleReset}
              className={`px-4 py-2 rounded font-semibold ${
                failedRoads.length === 0 
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Sem Falhas (Resetar)
            </button>
            {roads.map(road => (
              <button
                key={road.id}
                onClick={() => handleRoadClick(road.id)}
                className={`px-4 py-2 rounded text-sm ${
                  failedRoads.includes(road.id) 
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {road.from} ↔ {road.to}
              </button>
            ))}
          </div>
        </div>

        <div>
          {activeTab === 'grafo' && selectedRoute ? (
            <GraphView 
              failedRoads={failedRoads} 
              calculations={calculations}
              onRoadClick={handleRoadClick}
              selectedRoute={selectedRoute}
            />
          ) : activeTab === 'grafo' ? (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="text-gray-500">
                <p className="text-lg font-semibold mb-2">📍 Selecione uma rota</p>
                <p className="text-sm">Use o seletor de rotas acima para escolher origem e destino, depois clique em "Gerar Grafo"</p>
              </div>
            </div>
          ) : null}
          {activeTab === 'calculos' && calculations && <CalculationsView calculations={calculations} />}
          {activeTab === 'robustez' && calculations && <RobustnessView calculations={calculations} calculateAllPaths={calculateAllPaths} />}
          {activeTab === 'codigo' && <PythonCodeView />}
        </div>

        <div className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-6 shadow-lg">
          <h3 className="text-xl font-bold mb-3">📚 Instruções de Uso:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li><strong>Seletor de Rotas:</strong> Escolha uma origem e destino, depois clique em "Gerar Grafo" para calcular via API Python</li>
            <li><strong>Visualização:</strong> Explore o grafo da rede com 5 cidades da região</li>
            <li><strong>Cálculos:</strong> Veja os caminhos calculados MANUALMENTE (sem algoritmos prontos)</li>
            <li><strong>Simulação:</strong> Teste falhas em estradas (clicando no gráfico ou nos botões) e veja rotas alternativas</li>
            <li><strong>Robustez:</strong> Analise quais estradas são críticas para a rede</li>
            <li><strong>Código:</strong> Copie o código Python completo para executar localmente</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default LogisticsRouteOptimizer;