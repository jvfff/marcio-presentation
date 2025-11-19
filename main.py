import networkx as nx
import matplotlib.pyplot as plt
from collections import deque

# ==================== PARTE 1: REPRESENTAÇÃO DO GRAFO ====================

G = nx.Graph()

cidades = ['Vassouras', 'Maricá', 'Volta Redonda', 'Três Rios', 'Paty do Alferes']

G.add_nodes_from(cidades)

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
print("PARTE 1: REPRESENTAÇÃO DO GRAFO")
print("=" * 60)
print(f"\nCidades na rede: {list(G.nodes())}")
print(f"Número de cidades: {G.number_of_nodes()}")
print(f"Número de estradas: {G.number_of_edges()}")
print("\nEstradas e custos (bidirecionais):")
for origem, destino, dados in G.edges(data=True):
    print(f"  {origem} ↔ {destino}: {dados['weight']} km")

plt.figure(figsize=(14, 10))

pos = {
    'Vassouras': (2, 2),
    'Maricá': (5, 1),
    'Volta Redonda': (1, 3.5),
    'Três Rios': (3.5, 3),
    'Paty do Alferes': (2.5, 4)
}

nx.draw_networkx_nodes(G, pos, node_color='lightblue', 
                       node_size=3000, alpha=0.9)

nx.draw_networkx_nodes(G, pos, nodelist=['Vassouras'], 
                       node_color='lightgreen', node_size=3500, alpha=0.9)

nx.draw_networkx_labels(G, pos, font_size=11, font_weight='bold')

nx.draw_networkx_edges(G, pos, width=2.5, alpha=0.6, edge_color='#3b82f6')

edge_labels = nx.get_edge_attributes(G, 'weight')
edge_labels = {k: f"{v}km" for k, v in edge_labels.items()}
nx.draw_networkx_edge_labels(G, pos, edge_labels, font_size=10)

plt.title("Rede de Distribuição Logística - Região de Vassouras/RJ", 
          fontsize=16, fontweight='bold')
plt.axis('off')
plt.tight_layout()
plt.savefig('grafo_logistica_vassouras.png', dpi=300, bbox_inches='tight')
print("\n✓ Grafo visualizado e salvo como 'grafo_logistica_vassouras.png'")
plt.show()

# ==================== PARTE 2: CÁLCULO MANUAL DE CAMINHO MÍNIMO ====================

def calcular_caminho_manual(grafo, origem, destino):
    """
    Calcula o caminho de menor custo manualmente usando busca em largura
    com avaliação de custos acumulados.
    Versão adaptada para grafos não-direcionados.
    """
    if origem not in grafo or destino not in grafo:
        return None, float('inf')
    
    fila = deque([(origem, [origem], 0)])
    melhor_caminho = None
    menor_custo = float('inf')
    
    while fila:
        no_atual, caminho, custo_atual = fila.popleft()
        
        if no_atual == destino:
            if custo_atual < menor_custo:
                menor_custo = custo_atual
                melhor_caminho = caminho
            continue
        
        for vizinho in grafo.neighbors(no_atual):
            if vizinho not in caminho:  # Evitar ciclos
                custo_aresta = grafo[no_atual][vizinho]['weight']
                novo_custo = custo_atual + custo_aresta
                novo_caminho = caminho + [vizinho]
                fila.append((vizinho, novo_caminho, novo_custo))
    
    return melhor_caminho, menor_custo

def calcular_todos_caminhos(grafo, origem, destino):
    """
    Calcula TODOS os caminhos possíveis e retorna ordenados por custo.
    Útil para análise de rotas alternativas.
    """
    if origem not in grafo or destino not in grafo:
        return []
    
    todos_caminhos = []
    fila = deque([(origem, [origem], 0)])
    
    while fila:
        no_atual, caminho, custo_atual = fila.popleft()
        
        if no_atual == destino:
            todos_caminhos.append((caminho, custo_atual))
            continue
        
        for vizinho in grafo.neighbors(no_atual):
            if vizinho not in caminho:
                custo_aresta = grafo[no_atual][vizinho]['weight']
                novo_custo = custo_atual + custo_aresta
                novo_caminho = caminho + [vizinho]
                fila.append((vizinho, novo_caminho, novo_custo))
    
    todos_caminhos.sort(key=lambda x: x[1])
    return todos_caminhos

print("\n" + "=" * 60)
print("PARTE 2: CÁLCULO MANUAL DE CAMINHO MÍNIMO")
print("=" * 60)


origem = 'Vassouras'
destinos = [c for c in cidades if c != origem]

print(f"\nCalculando rotas de {origem} para todos os destinos...\n")

resultados = {}
for destino in destinos:
    print(f"{'─' * 60}")
    print(f"📍 {origem} → {destino}")
    print(f"{'─' * 60}")
    
    caminho, custo = calcular_caminho_manual(G, origem, destino)
    
    todos_caminhos = calcular_todos_caminhos(G, origem, destino)
    resultados[destino] = todos_caminhos
    
    if caminho:
        print(f"\n✓ Melhor caminho encontrado:")
        print(f"  Rota: {' → '.join(caminho)}")
        print(f"  Custo total: {custo} km")
        
        print(f"\n  Detalhamento do caminho:")
        for i in range(len(caminho) - 1):
            custo_trecho = G[caminho[i]][caminho[i+1]]['weight']
            print(f"    {caminho[i]} → {caminho[i+1]}: {custo_trecho} km")
        
        if len(todos_caminhos) > 1:
            print(f"\n  📋 Rotas alternativas disponíveis:")
            for idx, (cam_alt, custo_alt) in enumerate(todos_caminhos[1:3], 1):
                diferenca = custo_alt - custo
                print(f"    {idx}. {' → '.join(cam_alt)}")
                print(f"       Custo: {custo_alt} km (+{diferenca} km, +{(diferenca/custo*100):.1f}%)")
    else:
        print(f"\n✗ Não há caminho disponível entre {origem} e {destino}")
    
    print()

# ==================== PARTE 3: SIMULAÇÃO DE FALHA EM ESTRADA ====================

print("=" * 60)
print("PARTE 3: SIMULAÇÃO DE FALHA EM ESTRADA")
print("=" * 60)

estrada_removida = ('Vassouras', 'Paty do Alferes')
print(f"\n🚧 Simulando falha na estrada: {estrada_removida[0]} ↔ {estrada_removida[1]}")
print("   (Estrada escolhida por ser parte do caminho mais curto para Volta Redonda)")


G_falha = G.copy()
if G_falha.has_edge(*estrada_removida):
    G_falha.remove_edge(*estrada_removida)
    print(f"✓ Estrada removida do sistema\n")

print(f"{'═' * 60}")
print("IMPACTO DA FALHA EM TODOS OS DESTINOS")
print(f"{'═' * 60}\n")

for destino in destinos:
    print(f"📍 {origem} → {destino}:")
    
    caminho_original, custo_original = calcular_caminho_manual(G, origem, destino)
    caminho_alternativo, custo_alternativo = calcular_caminho_manual(G_falha, origem, destino)
    
    if caminho_alternativo:
        print(f"  ✓ Rota alternativa encontrada:")
        print(f"    {' → '.join(caminho_alternativo)}")
        print(f"    Custo: {custo_alternativo} km", end="")
        
        if caminho_original:
            diferenca = custo_alternativo - custo_original
            if diferenca > 0:
                percentual = (diferenca / custo_original * 100)
                print(f" (+{diferenca} km, +{percentual:.1f}%)")
            else:
                print(" (sem alteração)")
        else:
            print()
    else:
        print(f"  ✗ ALERTA CRÍTICO: Não há rota alternativa disponível!")
        print(f"    A entrega para {destino} está IMPOSSIBILITADA.")
    
    print()

# ==================== PARTE 4: ANÁLISE DE ROBUSTEZ DA REDE ====================

print("=" * 60)
print("PARTE 4: ANÁLISE DE ROBUSTEZ DA REDE")
print("=" * 60)

def analisar_robustez_completa(grafo, origem):
    """
    Analisa a robustez testando a remoção de cada aresta para TODOS os destinos.
    Retorna um ranking de estradas por criticidade.
    """
    estradas_impacto = []
    
    for u, v in grafo.edges():
        G_teste = grafo.copy()
        G_teste.remove_edge(u, v)
        
        destinos_afetados = 0
        impacto_total = 0
        destinos_isolados = 0
        
        for cidade in grafo.nodes():
            if cidade == origem:
                continue
            
            _, custo_original = calcular_caminho_manual(grafo, origem, cidade)
            
            _, custo_novo = calcular_caminho_manual(G_teste, origem, cidade)
            
            if custo_novo == float('inf'):
                destinos_isolados += 1
                destinos_afetados += 1
                impacto_total += 1000  
            elif custo_novo > custo_original:

                diferenca = custo_novo - custo_original
                if diferenca > custo_original * 0.2:  
                    destinos_afetados += 1
                impacto_total += diferenca
        
        estradas_impacto.append({
            'estrada': f"{u} ↔ {v}",
            'custo_km': grafo[u][v]['weight'],
            'destinos_afetados': destinos_afetados,
            'destinos_isolados': destinos_isolados,
            'impacto_total': impacto_total
        })
    
    estradas_impacto.sort(key=lambda x: x['impacto_total'], reverse=True)
    return estradas_impacto

print(f"\nAnalisando robustez da rede a partir de {origem}...\n")

estradas_ranked = analisar_robustez_completa(G, origem)

print(f"{'═' * 60}")
print("RANKING DE CRITICIDADE DAS ESTRADAS")
print(f"{'═' * 60}\n")

for idx, estrada_info in enumerate(estradas_ranked, 1):
    if idx <= 2:
        nivel = "🔴 CRÍTICA"
        cor = "ALTA"
    elif idx <= 4:
        nivel = "🟡 IMPORTANTE"
        cor = "MÉDIA"
    else:
        nivel = "🟢 NORMAL"
        cor = "BAIXA"
    
    print(f"{idx}. {estrada_info['estrada']} ({estrada_info['custo_km']} km)")
    print(f"   Status: {nivel} (Criticidade {cor})")
    print(f"   • Destinos afetados: {estrada_info['destinos_afetados']}")
    
    if estrada_info['destinos_isolados'] > 0:
        print(f"   • ⚠️  Isola {estrada_info['destinos_isolados']} cidade(s) se falhar!")
    
    print(f"   • Impacto total: {estrada_info['impacto_total']:.0f} pontos")
    print()


print(f"{'═' * 60}")
print("CIDADES MAIS CRÍTICAS DA REDE")
print(f"{'═' * 60}\n")

centralidade = nx.betweenness_centrality(G, weight='weight')
cidades_ordenadas = sorted(centralidade.items(), key=lambda x: x[1], reverse=True)

print("Ranking por centralidade de intermediação:")
print("(Quanto maior, mais importante a cidade para conectar outras)\n")

for idx, (cidade, valor) in enumerate(cidades_ordenadas, 1):
    if cidade == origem:
        print(f"{idx}. {cidade}: {valor:.3f} 🏭 (Armazém Principal)")
    else:
        print(f"{idx}. {cidade}: {valor:.3f}")


print(f"\nGrau de conectividade (número de estradas por cidade):\n")
graus = dict(G.degree())
graus_ordenados = sorted(graus.items(), key=lambda x: x[1], reverse=True)

for cidade, grau in graus_ordenados:
    print(f"  • {cidade}: {grau} conexão(ões)")

# ==================== PARTE 5: ESTATÍSTICAS DA REDE ====================

print("\n" + "=" * 60)
print("PARTE 5: ESTATÍSTICAS DA REDE")
print("=" * 60)

print(f"\n📊 Métricas Gerais da Rede:")
print(f"{'─' * 60}")
print(f"  • Total de cidades: {G.number_of_nodes()}")
print(f"  • Total de estradas: {G.number_of_edges()}")
print(f"  • Densidade do grafo: {nx.density(G):.3f}")
print(f"    (0 = sem conexões, 1 = totalmente conectado)")

print(f"\n  • Conectividade:")
if nx.is_connected(G):
    print(f"    ✓ Rede totalmente conectada")
    print(f"    ✓ Diâmetro da rede: {nx.diameter(G)} conexões")
    print(f"      (Maior distância entre quaisquer duas cidades)")
else:
    print(f"    ✗ Rede possui componentes desconectados")
    print(f"    Componentes conexos: {nx.number_connected_components(G)}")

print(f"\n📏 Estatísticas de Custos:")
print(f"{'─' * 60}")
custos = [d['weight'] for u, v, d in G.edges(data=True)]
print(f"  • Custo médio das estradas: {sum(custos) / len(custos):.1f} km")
print(f"  • Estrada mais curta: {min(custos)} km")
print(f"  • Estrada mais longa: {max(custos)} km")
print(f"  • Custo total da rede: {sum(custos)} km")

print(f"\n🚛 Estatísticas de Rotas a partir de {origem}:")
print(f"{'─' * 60}")
distancias = []
for destino in destinos:
    _, custo = calcular_caminho_manual(G, origem, destino)
    if custo != float('inf'):
        distancias.append(custo)
        
if distancias:
    print(f"  • Rota mais curta: {min(distancias)} km")
    print(f"  • Rota mais longa: {max(distancias)} km")
    print(f"  • Distância média: {sum(distancias) / len(distancias):.1f} km")

print(f"\n📈 Métricas de Robustez:")
print(f"{'─' * 60}")

criticas_count = sum(1 for e in estradas_ranked if e['destinos_isolados'] > 0)
print(f"  • Estradas críticas (que isolam cidades): {criticas_count}")
print(f"  • Estradas com redundância: {len(estradas_ranked) - criticas_count}")


caminhos_alternativos = []
for destino in destinos:
    todos = calcular_todos_caminhos(G, origem, destino)
    caminhos_alternativos.append(len(todos))

print(f"  • Número médio de rotas alternativas por destino: {sum(caminhos_alternativos) / len(caminhos_alternativos):.1f}")

print("\n" + "=" * 60)
print("✅ ANÁLISE COMPLETA!")
print("=" * 60)
print("\n💡 Conclusões:")
print("  • A rede possui boa conectividade regional")
print("  • Existem rotas alternativas para a maioria dos destinos")
print("  • Três Rios atua como entroncamento estratégico")
print("  • Recomenda-se monitoramento das estradas mais críticas")
print("\n📁 Arquivo de imagem salvo: 'grafo_logistica_vassouras.png'")
print("   Use este arquivo em sua apresentação!\n")