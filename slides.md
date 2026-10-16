---
marp: true
theme: gaia
paginate: true
size: 16:9
backgroundColor: #ffffff
color: #52525b
header: 'MusicGraph'
footer: 'Tech Talk'
style: |
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

  section {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 24px;
    padding: 56px 72px;
    justify-content: flex-start;
    background-color: #ffffff;
    color: #52525b;
    letter-spacing: -0.01em;
  }

  section.lead {
    justify-content: center;
  }

  header, footer {
    font-size: 13px;
    color: #a1a1aa;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 500;
  }

  h1, h2, h3 {
    font-weight: 700;
  }

  h1 {
    color: #09090b;
    font-size: 2.3rem;
    letter-spacing: -0.035em;
    line-height: 1.15;
    margin: 0 0 0.5rem 0;
  }

  h2 {
    color: #09090b;
    font-size: 1.55rem;
    letter-spacing: -0.025em;
    line-height: 1.25;
    margin: 0 0 1.2rem 0;
  }

  h3 {
    font-size: 1.15rem;
    letter-spacing: -0.015em;
    color: #18181b;
    margin: 0 0 0.4rem 0;
  }

  p {
    line-height: 1.6;
    margin: 0 0 0.8rem 0;
  }

  ul {
    margin: 0 0 0.8rem 0;
    padding-left: 1.2rem;
  }

  li {
    line-height: 1.6;
    margin-bottom: 0.35rem;
    color: #3f3f46;
  }

  strong {
    color: #09090b;
    font-weight: 600;
  }

  .accent {
    color: #0284c7;
  }

  .accent-purple {
    color: #7c3aed;
  }

  .accent-emerald {
    color: #059669;
  }

  .tag {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: #0284c7;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 0.5rem;
    font-weight: 600;
  }

  .corner-tag {
    position: absolute;
    top: 44px;
    left: 72px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: #0284c7;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 600;
  }

  code {
    font-family: 'JetBrains Mono', monospace;
    background: #f4f4f5;
    border: 1px solid #e4e4e7;
    color: #0284c7;
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
    font-size: 0.82em;
    font-weight: 500;
  }

  pre {
    background: #f8fafc !important;
    border: 1px solid #e2e8f0;
    border-left: 3px solid #0284c7;
    border-radius: 8px;
    padding: 0.8rem 1rem;
    margin: 0.6rem 0;
  }

  pre code {
    background: transparent !important;
    border: none;
    padding: 0;
    font-size: 0.78em;
    line-height: 1.5;
    color: #0f172a;
  }

  .sub {
    color: #52525b;
    font-size: 1.05rem;
    margin-bottom: 1.8rem;
  }

  .cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.8rem;
  }

  .box {
    border: 1px solid #e4e4e7;
    background: #fafafa;
    padding: 1.1rem 1.3rem;
    border-radius: 8px;
    border-top: 2px solid #e4e4e7;
  }

  .box.blue {
    border-top-color: #0284c7;
  }

  .box.purple {
    border-top-color: #7c3aed;
  }

  .box.emerald {
    border-top-color: #059669;
  }

  blockquote {
    border-left: 3px solid #0284c7;
    background: #f8fafc;
    border-radius: 0 8px 8px 0;
    padding: 0.8rem 1.2rem;
    color: #18181b;
    margin: 1rem 0;
  }
---

<!-- _class: lead -->
<!-- _paginate: false -->
<!-- _header: '' -->
<!-- _footer: '' -->

<div class="corner-tag">Tech Talk • Exploration Graphe</div>

# Music<span class="accent">Graph</span>
## Visualiser et interroger les réseaux de collaboration musicale.

<p class="sub">Retour d'expérience sur la modélisation en base graphe avec <span class="accent">Neo4j</span>, TypeScript et vis-network.</p>

<p style="font-size: 0.9rem; color: #71717a; font-family: 'JetBrains Mono', monospace;">Lucas Diot</p>

---

<div class="tag">01 / Problématique</div>

## La musique est un <span class="accent">réseau</span>. Le SQL ne l'est pas.

Une discographie n'est pas une simple liste d'enregistrements : c'est une toile de featurings, de producteurs partagés, de labels et de styles croisés.

<div class="cols" style="margin-top: 1rem;">
<div class="box">
<div class="tag" style="color: #e11d48;">Approche relationnelle (SQL)</div>

* Jointures récursives (`JOIN` sur 4-5 tables).
* Requêtes `WITH RECURSIVE` lentes et complexes.
* La latence explose dès qu'on cherche au-delà du 2ᵉ degré de séparation.
</div>

<div class="box blue">
<div class="tag">Approche graphe (Neo4j)</div>

* Les **relations** sont des données de premier ordre.
* Trouver le chemin le plus court est une primitive native.
* Naviguer d'un artiste à l'autre se fait à coût constant.
</div>
</div>

---

<div class="tag">02 / Architecture des données</div>

## <span class="accent">Index-Free Adjacency</span> : la vraie différence

Dans une BDD relationnelle, faire une jointure implique de parcourir des B-Trees : la complexité dépend de la **taille de la table**.

Dans **Neo4j** :
* Chaque nœud garde en mémoire des **pointeurs directs** vers ses voisins physiques.
* Traverser un lien se fait en **$O(1)$** par saut.
* Le temps de requête dépend uniquement de la **taille du voisinage local**, pas de la taille globale de la base.

<blockquote>
Trouver les connexions d'un artiste prend exactement le même temps que la base contienne 50 ou 5 millions d'enregistrements.
</blockquote>

---

<div class="tag">03 / Modélisation</div>

## Le schéma de données (Property Graph)

<div class="cols">
<div class="box blue">
<div class="tag">Nœuds (Entités)</div>

* <strong class="accent">Artist</strong> : nom, dates, pays, MBID
* <strong class="accent">Recording</strong> : morceaux et featurings
* <strong class="accent">Release</strong> : albums, singles, EPs
* <strong class="accent">Label</strong> & <strong class="accent">Area</strong> : structure et origines
* <strong class="accent">Genre</strong> : tags musicaux normalisés
</div>

<div class="box purple">
<div class="tag" style="color: #7c3aed;">Relations typées</div>

* `(:Artist)-[:PERFORMED]->(:Recording)`
* `(:Artist)-[:FEATURED_ON]->(:Recording)`
* `(:Recording)-[:APPEARS_ON]->(:Release)`
* `(:Artist)-[:COLLABORATED_WITH {count}]->(:Artist)`  
  *(arête directe matérialisée pour accélérer les calculs de réseau)*
</div>
</div>

---

<div class="tag">04 / Stack technique</div>

## Architecture de l'application

Un pipeline complet, léger et conteneurisé sous Docker.

```
React (Vite) ──────────> Express API (TS) ──────────> Neo4j 5
Canvas (vis-network)     RequestQueue (Rate limiter)  Protocole Bolt (:7687)
Port 80                  Port 3001
                               │
                               ▼ HTTPS
                         MusicBrainz API (Open Data)
```

* **Frontend** : React 18, rendu Canvas via <span class="accent">vis-network</span> (simulation physique ForceAtlas2).
* **Backend** : Node.js / TypeScript, driver officiel `neo4j-driver`.
* **Infra** : `docker-compose` avec healthcheck Neo4j et isolation réseau.

---

<div class="tag">05 / Challenge technique</div>

## Vivre avec la limite de MusicBrainz : <span class="accent">1 req/s</span>

L'API MusicBrainz est ouverte et gratuite, mais bloque immédiatement au-delà d'**1 requête par seconde**.

**Comment l'absorber proprement côté backend ?**

1. <strong class="accent">RequestQueue sur-mesure</strong> : file d'attente FIFO asynchrone qui cadence chaque appel à **1 100 ms**.
2. <strong class="accent">Backoff exponentiel</strong> : retry automatique avec délai progressif en cas de code `503 / 429`.
3. <strong class="accent">Mode secours (`DEMO_CATALOG`)</strong> : mock local propre en fallback pour garantir que la démo ne plante jamais.

---

<div class="tag">06 / Idempotence</div>

## Écrire sans doublon : la clause <span class="accent">MERGE</span>

En important des artistes et leurs collaborations, on croise en boucle les mêmes entités.

```cypher
MERGE (a:Artist {mbid: $mbid})
ON CREATE SET a.name = $name, a.lastImported = datetime()
ON MATCH SET a.lastImported = datetime()
```

* **Identifiant stable** : utilisation stricte du <span class="accent">MBID</span> (identifiant universel MusicBrainz).
* **Nœuds squelettes** : un invité est créé sous forme minimale lors d'un featuring, puis complété lors d'un crawl ultérieur.

---

<div class="tag">07 / Frontend & Rendu</div>

## Pourquoi React ne doit pas toucher à la physique

Gérer 300 nœuds et 500 arêtes avec la simulation physique en React state :
* Résultat : **60 re-renders par seconde**, UI saccadée, crash d'onglet.

<div class="box emerald" style="margin-top: 1rem;">
<div class="tag" style="color: #059669;">Architecture retenue</div>

* Le composant React monte un simple conteneur DOM via `useRef`.
* La physique (ForceAtlas2) tourne sur un élément `<canvas>` géré à 100% par **vis-network**.
* React n'intervient **que sur les événements métier** (sélection d'un nœud, filtre par genre).
</div>

---

<div class="tag">08 / Démo live</div>

## Ce qu'on va observer en direct

1. <strong class="accent">Dashboard & Centralité</strong> : qui est le carrefour de notre sous-graphe actuel ? *(ex: PLK avec 19 connexions directes)*
2. <strong class="accent">Exploration visuelle</strong> : filtrage dynamique des types de nœuds, navigation physique au drag-and-drop.
3. <strong class="accent">Crawl en tâche de fond</strong> : transformer un nœud squelette en discographie complète en 1 clic.

---

<div class="tag">09 / Sous le capot</div>

## Deux requêtes Cypher clés

Trouver le plus court chemin entre deux artistes (*Kevin Bacon effect*) :

```cypher
MATCH (p1:Artist {name: "PLK"}), (p2:Artist),
      path = shortestPath((p1)-[:COLLABORATED_WITH*]-(p2))
WHERE p1 <> p2
RETURN path LIMIT 1
```

Extraire le sous-graphe des collaborations les plus fréquentes :

```cypher
MATCH (a1:Artist)-[c:COLLABORATED_WITH]-(a2:Artist)
WHERE c.count >= 2
RETURN a1.name, a2.name, c.count
ORDER BY c.count DESC
```

---

<div class="tag">10 / Conclusion</div>

## Ce que j'en retiens

<div class="cols">
<div class="box blue">
<div class="tag">Points forts</div>

* Le modèle graphe simplifie radicalement les requêtes complexes de chemin et de recommandation.
* Cypher est beaucoup plus intuitif que du SQL récursif pour explorer des réseaux.
</div>

<div class="box purple">
<div class="tag" style="color: #7c3aed;">Perspectives</div>

* Utiliser **Graph Data Science (GDS)** pour calculer automatiquement les communautés (Louvain) ou l'influence (PageRank).
* Enrichir avec l'API Spotify (analyse audio, tempo, popularité).
</div>
</div>

---

<!-- _class: lead -->
<!-- _paginate: false -->
<!-- _header: '' -->
<!-- _footer: '' -->

<div class="corner-tag">Fin de présentation</div>

# Questions & discussion

<br>

<p style="font-family: 'JetBrains Mono', monospace; font-size: 0.95rem; color: #71717a;">
App : <span class="accent">http://localhost</span> &nbsp;•&nbsp; Neo4j : <span class="accent">http://localhost:7474</span>
</p>
