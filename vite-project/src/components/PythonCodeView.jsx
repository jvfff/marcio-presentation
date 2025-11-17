// src/components/PythonCodeView.jsx
import React from 'react';
import { Download } from 'lucide-react';

const pythonCode = `import matplotlib.pyplot as plt
from typing import List, Dict, Tuple

# ========================================
# PARTE 1: DEFINIÇÃO DO GRAFO
# ========================================

# Criar o grafo direcionado
G = nx.DiGraph()

# Definir as cidades (vértices)
cidades = ['Vassouras', 'Maricá', 'Volta Redonda', 'Três Rios', 'Paty do Alferes']
G.add_nodes_from(cidades)

# Definir as estradas (arestas) com custos em km
estradas = [
    ('Vassouras', 'Maricá', 85),
    ('Vassouras', 'Três Rios', 45),
    ('Vassouras', 'Paty do Alferes', 30),
    ('Maricá', 'Três Rios', 65),
    ('Três Rios', 'Volta Redonda', 50),
    ('Paty do Alferes', 'Volta Redonda', 40),
    ('Três Rios', 'Paty do Alferes', 35)
]

for origem, destino, custo in estradas:
    G.add_edge(origem, destino, weight=custo)

print("=" * 60)
print("REDE DE DISTRIBUIÇÃO CRIADA")
print("=" * 60)
print(f"Total de cidades: {G.number_of_nodes()}")
print(f"Total de estradas: {G.number_of_edges()}")
print()

# ========================================
# PARTE 2: CÁLCULO MANUAL DE CAMINHOS
# ========================================

def calcular_todos_caminhos(grafo, origem, destino):
    """
    Calcula MANUALMENTE todos os caminhos possíveis entre duas cidades.
    Usando busca em profundidade (DFS) para explorar todas as rotas.
    """
    caminhos = []
    
    def dfs(atual, destino, visitados, caminho, custo):
        if atual == destino:
            caminhos.append({
                'caminho': caminho.copy(),
                'custo': custo
            })
            return
        
        visitados.add(atual)
        
        # Explorar todas as cidades conectadas
        for vizinho in grafo.neighbors(atual):
            if vizinho not in visitados:
                custo_estrada = grafo[atual][vizinho]['weight']
                caminho.append((atual, vizinho, custo_estrada))
                dfs(vizinho, destino, visitados, caminho, custo + custo_estrada)
                caminho.pop()
        
        visitados.remove(atual)
    
    dfs(origem, destino, set(), [], 0)
    return sorted(caminhos, key=lambda x: x['custo'])

# Calcular caminhos para todos os destinos
armazem = 'Vassouras'
destinos = [c for c in cidades if c != armazem]

print("=" * 60)
print("CÁLCULO MANUAL DE CAMINHOS MÍNIMOS")
print("=" * 60)

resultados = {}
for destino in destinos:
    caminhos = calcular_todos_caminhos(G, armazem, destino)
    resultados[destino] = caminhos
    
    print(f"\\n{armazem} → {destino}:")
    print(f"  Total de rotas possíveis: {len(caminhos)}")
    
    if caminhos:
        melhor = caminhos[0]
        print(f"  ✓ Caminho mais curto:")
        rota = ' → '.join([melhor['caminho'][0][0]] + 
                          [e[1] for e in melhor['caminho']])
        print(f"    {rota}")
        print(f"    Custo total: {melhor['custo']} km")
        
        if len(caminhos) > 1:
            print(f"  Rotas alternativas:")
            for i, alt in enumerate(caminhos[1:3], 1):
                rota_alt = ' → '.join([alt['caminho'][0][0]] + 
                                      [e[1] for e in alt['caminho']])
                print(f"    {i}. {rota_alt} ({alt['custo']} km)")

# ========================================
# PARTE 3: SIMULAÇÃO DE FALHA
# ========================================

print("\\n" + "=" * 60)
print("SIMULAÇÃO DE FALHA NA ESTRADA")
print("=" * 60)

# Escolher uma estrada crítica para simular falha
estrada_falha = ('Vassouras', 'Três Rios')
print(f"\\nSimulando falha na estrada: {estrada_falha[0]} ↔ {estrada_falha[1]}")

# Criar grafo sem a estrada com falha
G_falha = G.copy()
G_falha.remove_edge(*estrada_falha)

print(f"\\nRecalculando rotas sem a estrada {estrada_falha[0]}-{estrada_falha[1]}:\\n")

for destino in destinos:
    caminhos_alternativos = calcular_todos_caminhos(G_falha, armazem, destino)
    caminho_original = resultados[destino][0] if resultados[destino] else None
    
    print(f"{armazem} → {destino}:")
    
    if caminhos_alternativos:
        melhor_alt = caminhos_alternativos[0]
        rota = ' → '.join([melhor_alt['caminho'][0][0]] + 
                          [e[1] for e in melhor_alt['caminho']])
        
        if caminho_original:
            diferenca = melhor_alt['custo'] - caminho_original['custo']
            print(f"  ✓ Nova rota: {rota}")
            print(f"    Custo: {melhor_alt['custo']} km (+{diferenca} km)")
        else:
            print(f"  ✓ Rota alternativa: {rota}")
            print(f"    Custo: {melhor_alt['custo']} km")
    else:
        print(f"  ✗ CIDADE ISOLADA! Nenhuma rota disponível.")
    print()

# ========================================
# PARTE 4: ANÁLISE DE ROBUSTEZ
# ========================================

print("=" * 60)
print("ANÁLISE DE ROBUSTEZ DA REDE")
print("=" * 60)

estradas_criticas = []

for origem, destino, custo in estradas:
    G_teste = G.copy()
    G_teste.remove_edge(origem, destino)
    
    cidades_afetadas = 0
    impacto_total = 0
    
    for dest in destinos:
        try:
            caminho_original = resultados[dest][0]['custo']
            caminhos_teste = calcular_todos_caminhos(G_teste, armazem, dest)
            
            if not caminhos_teste:
                cidades_afetadas += 1
                impacto_total += 999  # Penalidade alta para isolamento
            else:
                novo_custo = caminhos_teste[0]['custo']
                if novo_custo > caminho_original * 1.3:  # Aumento >30%
                    cidades_afetadas += 1
                    impacto_total += (novo_custo - caminho_original)
        except:
            pass
    
    estradas_criticas.append({
        'estrada': f"{origem} ↔ {destino}",
        'custo': custo,
        'cidades_afetadas': cidades_afetadas,
        'impacto': impacto_total
    })

# Ordenar por impacto
estradas_criticas.sort(key=lambda x: x['impacto'], reverse=True)

print("\\nEstradas ordenadas por criticidade:\\n")
for i, ec in enumerate(estradas_criticas, 1):
    nivel = "CRÍTICA" if i <= 2 else "IMPORTANTE" if i <= 4 else "NORMAL"
    print(f"{i}. {ec['estrada']} ({ec['custo']} km)")
    print(f"   Status: {nivel}")
    print(f"   Impacta {ec['cidades_afetadas']} destino(s)")
    print()

# ========================================
# PARTE 5: VISUALIZAÇÃO
# ========================================

plt.figure(figsize=(14, 10))

# Layout do grafo
pos = {
    'Vassouras': (2, 2),
    'Maricá': (5, 1),
    'Volta Redonda': (1, 3.5),
    'Três Rios': (3.5, 3),
    'Paty do Alferes': (2.5, 4)
}

# Desenhar o grafo
nx.draw_networkx_nodes(G, pos, node_color='lightblue', 
                       node_size=3000, alpha=0.9)

# Destacar o armazém
nx.draw_networkx_nodes(G, pos, nodelist=['Vassouras'], 
                       node_color='lightgreen', node_size=3500, alpha=0.9)

nx.draw_networkx_labels(G, pos, font_size=10, font_weight='bold')

nx.draw_networkx_edges(G, pos, width=2, alpha=0.6, 
                       arrows=True, arrowsize=20)

# Adicionar labels de peso nas arestas
edge_labels = nx.get_edge_attributes(G, 'weight')
edge_labels = {k: f"{v}km" for k, v in edge_labels.items()}
nx.draw_networkx_edge_labels(G, pos, edge_labels, font_size=9)

plt.title("Rede de Distribuição Logística - Região de Vassouras/RJ", 
          fontsize=16, fontweight='bold')
plt.axis('off')
plt.tight_layout()
plt.savefig('rede_distribuicao.png', dpi=300, bbox_inches='tight')
print("\\nGráfico salvo como 'rede_distribuicao.png'")
plt.show()

print("\\n" + "=" * 60)
print("ANÁLISE COMPLETA!")
print("=" * 60);`;

const PythonCodeView = () => {
  return (
    <div className="bg-gray-900 text-gray-100 rounded-lg p-6 shadow-lg overflow-auto max-h-[600px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Download className="text-green-400" />
          Código Python Completo
        </h3>
        <button
          onClick={() => {
            navigator.clipboard.writeText(pythonCode);
            alert('Código copiado para área de transferência!');
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
        >
          Copiar Código
        </button>
      </div>
      <pre className="text-xs overflow-x-auto">
        <code>{pythonCode}</code>
      </pre>
    </div>
  );
};

export default PythonCodeView;