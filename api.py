import networkx as nx
from collections import deque
from flask import Flask, jsonify, request
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)

# ==================== CONFIGURAÇÃO DO GRAFO ====================

def criar_grafo():
    """Cria o grafo da rede de distribuição logística"""
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
    
    return G

G = criar_grafo()

# ==================== FUNÇÕES DE CÁLCULO ====================

def calcular_caminho_manual(grafo, origem, destino, excluir_arestas=None):
    """Calcula o caminho de menor custo entre dois pontos"""
    if excluir_arestas is None:
        excluir_arestas = []
    
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
            if vizinho not in caminho:
                # Verifica se a aresta deve ser excluída
                aresta = tuple(sorted([no_atual, vizinho]))
                if aresta in excluir_arestas:
                    continue
                
                custo_aresta = grafo[no_atual][vizinho]['weight']
                novo_custo = custo_atual + custo_aresta
                novo_caminho = caminho + [vizinho]
                fila.append((vizinho, novo_caminho, novo_custo))
    
    return melhor_caminho, menor_custo

def calcular_todos_caminhos(grafo, origem, destino, excluir_arestas=None):
    """Calcula TODOS os caminhos possíveis"""
    if excluir_arestas is None:
        excluir_arestas = []
    
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
                # Verifica se a aresta deve ser excluída
                aresta = tuple(sorted([no_atual, vizinho]))
                if aresta in excluir_arestas:
                    continue
                
                custo_aresta = grafo[no_atual][vizinho]['weight']
                novo_custo = custo_atual + custo_aresta
                novo_caminho = caminho + [vizinho]
                fila.append((vizinho, novo_caminho, novo_custo))
    
    todos_caminhos.sort(key=lambda x: x[1])
    return todos_caminhos

def analisar_robustez(grafo, origem):
    """Analisa a robustez testando remoção de cada aresta"""
    estradas_impacto = []
    
    for u, v in grafo.edges():
        destinos_afetados = 0
        impacto_total = 0
        destinos_isolados = 0
        
        excluir = [tuple(sorted([u, v]))]
        
        for cidade in grafo.nodes():
            if cidade == origem:
                continue
            
            _, custo_original = calcular_caminho_manual(grafo, origem, cidade)
            _, custo_novo = calcular_caminho_manual(grafo, origem, cidade, excluir)
            
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

# ==================== ENDPOINTS ====================

@app.route('/api/cidades', methods=['GET'])
def get_cidades():
    """Retorna lista de cidades"""
    return jsonify({
        'cidades': list(G.nodes())
    })

@app.route('/api/estradas', methods=['GET'])
def get_estradas():
    """Retorna lista de estradas"""
    estradas = []
    for origem, destino, dados in G.edges(data=True):
        estradas.append({
            'from': origem,
            'to': destino,
            'cost': dados['weight'],
            'id': f"{origem}-{destino}"
        })
    return jsonify({
        'estradas': estradas
    })

@app.route('/api/caminho-minimo', methods=['POST'])
def get_caminho_minimo():
    """
    Calcula o caminho mínimo entre dois pontos
    
    Body esperado:
    {
        "origem": "Vassouras",
        "destino": "Volta Redonda",
        "excluir_arestas": ["Vassouras-Paty do Alferes"]  // opcional
    }
    """
    try:
        data = request.get_json()
        origem = data.get('origem')
        destino = data.get('destino')
        excluir_arestas_raw = data.get('excluir_arestas', [])
        
        # Converter para formato esperado
        excluir_arestas = [tuple(sorted(aresta.split('-'))) for aresta in excluir_arestas_raw]
        
        caminho, custo = calcular_caminho_manual(G, origem, destino, excluir_arestas)
        
        if caminho:
            # Detalhar cada trecho
            detalhes = []
            for i in range(len(caminho) - 1):
                custo_trecho = G[caminho[i]][caminho[i+1]]['weight']
                detalhes.append({
                    'from': caminho[i],
                    'to': caminho[i+1],
                    'cost': custo_trecho
                })
            
            return jsonify({
                'success': True,
                'caminho': caminho,
                'custo_total': custo,
                'detalhes': detalhes
            })
        else:
            return jsonify({
                'success': False,
                'message': f'Sem caminho disponível entre {origem} e {destino}'
            }), 404
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/todos-caminhos', methods=['POST'])
def get_todos_caminhos():
    """
    Calcula todos os caminhos possíveis entre dois pontos
    
    Body esperado:
    {
        "origem": "Vassouras",
        "destino": "Volta Redonda",
        "excluir_arestas": []  // opcional
    }
    """
    try:
        data = request.get_json()
        origem = data.get('origem')
        destino = data.get('destino')
        excluir_arestas_raw = data.get('excluir_arestas', [])
        
        excluir_arestas = [tuple(sorted(aresta.split('-'))) for aresta in excluir_arestas_raw]
        
        caminhos = calcular_todos_caminhos(G, origem, destino, excluir_arestas)
        
        caminhos_formatados = [
            {
                'caminho': c[0],
                'custo': c[1]
            }
            for c in caminhos
        ]
        
        return jsonify({
            'success': True,
            'caminhos': caminhos_formatados,
            'total': len(caminhos_formatados)
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/calcular-rotas', methods=['POST'])
def calcular_rotas():
    """
    Calcula rotas para TODOS os destinos a partir de uma origem
    
    Body esperado:
    {
        "origem": "Vassouras",
        "excluir_arestas": []  // opcional
    }
    """
    try:
        data = request.get_json()
        origem = data.get('origem')
        excluir_arestas_raw = data.get('excluir_arestas', [])
        
        if origem not in G:
            return jsonify({
                'success': False,
                'message': f'Origem {origem} não existe'
            }), 400
        
        excluir_arestas = [tuple(sorted(aresta.split('-'))) for aresta in excluir_arestas_raw]
        
        destinos = [c for c in G.nodes() if c != origem]
        resultados = {}
        
        for destino in destinos:
            caminho, custo = calcular_caminho_manual(G, origem, destino, excluir_arestas)
            todos = calcular_todos_caminhos(G, origem, destino, excluir_arestas)
            
            if caminho:
                resultados[destino] = {
                    'shortest': {
                        'path': caminho,
                        'cost': custo
                    },
                    'alternatives': [
                        {
                            'path': c[0],
                            'cost': c[1]
                        }
                        for c in todos[1:3]
                    ],
                    'allPaths': [
                        {
                            'path': c[0],
                            'cost': c[1]
                        }
                        for c in todos
                    ]
                }
            else:
                resultados[destino] = {
                    'shortest': None,
                    'alternatives': [],
                    'allPaths': []
                }
        
        return jsonify({
            'success': True,
            'origem': origem,
            'calculos': resultados
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/robustez', methods=['POST'])
def get_robustez():
    """
    Analisa a robustez da rede
    
    Body esperado:
    {
        "origem": "Vassouras"
    }
    """
    try:
        data = request.get_json()
        origem = data.get('origem', 'Vassouras')
        
        robustez = analisar_robustez(G, origem)
        
        return jsonify({
            'success': True,
            'robustez': robustez
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/info', methods=['GET'])
def get_info():
    """Retorna informações gerais da rede"""
    custos = [d['weight'] for u, v, d in G.edges(data=True)]
    
    return jsonify({
        'info': {
            'total_cidades': G.number_of_nodes(),
            'total_estradas': G.number_of_edges(),
            'densidade': nx.density(G),
            'conectada': nx.is_connected(G),
            'diametro': nx.diameter(G) if nx.is_connected(G) else None,
            'custo_medio': sum(custos) / len(custos) if custos else 0,
            'custo_minimo': min(custos) if custos else 0,
            'custo_maximo': max(custos) if custos else 0,
            'custo_total': sum(custos)
        }
    })

@app.route('/api/health', methods=['GET'])
def health():
    """Verifica se a API está funcionando"""
    return jsonify({
        'status': 'ok',
        'message': 'API de Otimização de Rotas Logísticas'
    })

# ==================== INICIAR SERVIDOR ====================

if __name__ == '__main__':
    print("🚀 Iniciando API de Otimização de Rotas Logísticas...")
    print("📍 Acesse em http://localhost:5000")
    print("📚 Endpoints disponíveis:")
    print("   GET  /api/health")
    print("   GET  /api/cidades")
    print("   GET  /api/estradas")
    print("   GET  /api/info")
    print("   POST /api/caminho-minimo")
    print("   POST /api/todos-caminhos")
    print("   POST /api/calcular-rotas")
    print("   POST /api/robustez")
    app.run(debug=True, port=5000)
