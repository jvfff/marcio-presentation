import networkx as nx
import matplotlib.pyplot as plt
from collections import deque

G = nx.DiGraph()

cidades = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília', 'Curitiba']

G.add_nodes_from(cidades)

estradas = [
    ('São Paulo', 'Rio de Janeiro', 430),
    ('São Paulo', 'Curitiba', 410),
    ('São Paulo', 'Belo Horizonte', 586),
    ('Rio de Janeiro', 'Belo Horizonte', 444),
    ('Rio de Janeiro', 'Brasília', 1148),
    ('Belo Horizonte', 'Brasília', 716),
    ('Curitiba', 'São Paulo', 410),
    ('Brasília', 'Belo Horizonte', 716),
    ('Belo Horizonte', 'São Paulo', 586),
]

for origem, destino, custo in estradas:
    G.add_edge(origem, destino, weight=custo)

print("=" * 60)
print("PARTE 1: REPRESENTAÇÃO DO GRAFO")
print("=" * 60)
print(f"\nCidades na rede: {list(G.nodes())}")
print(f"Número de cidades: {G.number_of_nodes()}")
print(f"Número de estradas: {G.number_of_edges()}")
print("\nEstradas e custos:")
for origem, destino, dados in G.edges(data=True):
    print(f"  {origem} → {destino}: {dados['weight']} km")

plt.figure(figsize=(12, 8))
pos = nx.spring_layout(G, k=2, iterations=50, seed=42)
nx.draw(G, pos, with_labels=True, node_color='lightblue', 
        node_size=3000, font_size=10, font_weight='bold',
        arrows=True, arrowsize=20, edge_color='gray', width=2)

edge_labels = nx.get_edge_attributes(G, 'weight')
nx.draw_networkx_edge_labels(G, pos, edge_labels, font_size=9)

plt.title("Rede de Distribuição Logística", fontsize=16, fontweight='bold')
plt.axis('off')
plt.tight_layout()
plt.savefig('grafo_logistica.png', dpi=300, bbox_inches='tight')
print("\n✓ Grafo visualizado e salvo como 'grafo_logistica.png'")
plt.show()

def calcular_caminho_manual(grafo, origem, destino):
    """
    Calcula o caminho de menor custo manualmente usando busca em largura
    com avaliação de custos acumulados.
    """
    if origem not in grafo or destino not in grafo:
        return None, float('inf')
    
    fila = deque([(origem, [origem], 0)])
    melhor_caminho = None
    menor_custo = float('inf')
    
    visitados = set()
    
    while fila:
        no_atual, caminho, custo_atual = fila.popleft()
        
        if no_atual == destino:
            if custo_atual < menor_custo:
                menor_custo = custo_atual
                melhor_caminho = caminho
            continue
        
        for vizinho in grafo.neighbors(no_atual):
            if vizinho not in caminho:
                custo_aresta = grafo[no_atual][vizinho]['weight']
                novo_custo = custo_atual + custo_aresta
                novo_caminho = caminho + [vizinho]
                fila.append((vizinho, novo_caminho, novo_custo))
    
    return melhor_caminho, menor_custo

print("\n" + "=" * 60)
print("PARTE 2: CÁLCULO MANUAL DE CAMINHO MÍNIMO")
print("=" * 60)

origem = 'São Paulo'
destino = 'Brasília'

print(f"\nCalculando rota de {origem} para {destino}...")
caminho, custo = calcular_caminho_manual(G, origem, destino)

if caminho:
    print(f"\n✓ Melhor caminho encontrado:")
    print(f"  Rota: {' → '.join(caminho)}")
    print(f"  Custo total: {custo} km")
    
    print(f"\nDetalhamento do caminho:")
    for i in range(len(caminho) - 1):
        custo_trecho = G[caminho[i]][caminho[i+1]]['weight']
        print(f"  {caminho[i]} → {caminho[i+1]}: {custo_trecho} km")
else:
    print(f"\n✗ Não há caminho disponível entre {origem} e {destino}")

print("\n" + "=" * 60)
print("PARTE 3: SIMULAÇÃO DE FALHA EM ESTRADA")
print("=" * 60)

estrada_removida = ('Belo Horizonte', 'Brasília')
print(f"\nSimulando falha na estrada: {estrada_removida[0]} → {estrada_removida[1]}")

G_falha = G.copy()
if G_falha.has_edge(*estrada_removida):
    G_falha.remove_edge(*estrada_removida)
    print(f"✓ Estrada removida do sistema")

print(f"\nRecalculando rota de {origem} para {destino} com a falha...")
caminho_alternativo, custo_alternativo = calcular_caminho_manual(G_falha, origem, destino)

if caminho_alternativo:
    print(f"\n✓ Rota alternativa encontrada:")
    print(f"  Rota: {' → '.join(caminho_alternativo)}")
    print(f"  Custo total: {custo_alternativo} km")
    print(f"\n  Impacto: +{custo_alternativo - custo} km ({((custo_alternativo - custo) / custo * 100):.1f}% de aumento)")
else:
    print(f"\n✗ ALERTA: Não há rota alternativa disponível!")
    print(f"  A entrega para {destino} está impossibilitada.")

print("\n" + "=" * 60)
print("PARTE 4: ANÁLISE DE ROBUSTEZ DA REDE")
print("=" * 60)

def analisar_robustez(grafo, origem, destino):
    """
    Analisa a robustez testando a remoção de cada aresta.
    """
    arestas_criticas = []
    arestas_redundantes = []
    
    for u, v in grafo.edges():
        G_teste = grafo.copy()
        G_teste.remove_edge(u, v)
        
        caminho, custo = calcular_caminho_manual(G_teste, origem, destino)
        
        if caminho is None:
            arestas_criticas.append((u, v))
        else:
            arestas_redundantes.append((u, v, custo))
    
    return arestas_criticas, arestas_redundantes

print(f"\nAnalisando robustez para rotas de {origem} para {destino}...")

arestas_criticas, arestas_redundantes = analisar_robustez(G, origem, destino)

print(f"\n📍 ESTRADAS CRÍTICAS ({len(arestas_criticas)}):")
if arestas_criticas:
    print("  (Se falharem, impossibilitam a entrega)")
    for u, v in arestas_criticas:
        print(f"  • {u} → {v}")
else:
    print("  Nenhuma estrada é crítica para esta rota!")

print(f"\n📍 ESTRADAS COM REDUNDÂNCIA ({len(arestas_redundantes)}):")
print("  (Têm rotas alternativas se falharem)")
for u, v, custo_alt in arestas_redundantes[:5]:
    print(f"  • {u} → {v} (custo alternativo: {custo_alt} km)")

centralidade = nx.betweenness_centrality(G, weight='weight')
print(f"\n📍 CIDADES MAIS CRÍTICAS (por centralidade):")
cidades_ordenadas = sorted(centralidade.items(), key=lambda x: x[1], reverse=True)
for cidade, valor in cidades_ordenadas[:3]:
    print(f"  • {cidade}: {valor:.3f}")

print("\n" + "=" * 60)
print("PARTE 5: ESTATÍSTICAS DA REDE")
print("=" * 60)

print(f"\nMétricas gerais da rede:")
print(f"  • Densidade do grafo: {nx.density(G):.3f}")
print(f"  • Número de componentes conexos: {nx.number_weakly_connected_components(G)}")
print(f"  • Diâmetro aproximado: ", end="")
try:
    if nx.is_weakly_connected(G):
        diametro = nx.diameter(G.to_undirected())
        print(f"{diametro} conexões")
    else:
        print("Grafo não totalmente conectado")
except:
    print("Não calculável")

print(f"\n  • Custo médio das estradas: {sum(d['weight'] for u, v, d in G.edges(data=True)) / G.number_of_edges():.1f} km")
print(f"  • Custo mínimo: {min(d['weight'] for u, v, d in G.edges(data=True))} km")
print(f"  • Custo máximo: {max(d['weight'] for u, v, d in G.edges(data=True))} km")

print("\n" + "=" * 60)
print("ANÁLISE CONCLUÍDA!")
print("=" * 60)