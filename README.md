# MusicGraph — Exploration des collaborations musicales

**MusicGraph** est une application web complète permettant d'explorer et de visualiser le réseau de collaborations entre artistes musicaux. Le projet s'appuie sur la base de données orientée graphe **Neo4j**, l'API ouverte **MusicBrainz**, un backend API en **TypeScript (Express)**, et un frontend en **React (TypeScript)** avec rendu de graphe interactif (**vis-network**).

Ce projet a été réalisé dans le cadre du module NoSQL (B3 Dev & Data).

---

## 🚀 Fonctionnalités principales

1. **Recherche d'artistes en direct** : Recherche d'artistes en temps réel sur l'API globale MusicBrainz.
2. **Importation intelligente dans Neo4j** : Importation de l'artiste, de ses morceaux (`Recordings`), ses albums (`Releases`), ses régions (`Areas`), ses genres (`Genres`) et ses collaborateurs directs.
3. **Réseau de collaborations interactif** : Exploration physique du graphe en drag-and-drop, avec mise en évidence des liaisons fortes (collaborations répétées) et rôles (interprète vs featuring).
4. **Dashboard analytique** :
   * **Centralité de degré** : Classement des artistes les plus connectés du réseau.
   * **Top Collaborations** : Mise en évidence des duos les plus fréquents.
   * **Répartition des genres** : Analyse statistique des genres musicaux importés.
5. **Seeding local** : Script de peuplement pré-configuré avec des artistes populaires francophones et internationaux (Daft Punk, Stromae, Angèle, Damso, Kanye West, Jay-Z, Dua Lipa) pour tester le graphe immédiatement.

---

## 🛠️ Stack Technique

* **Base de données** : Neo4j (Modèle de graphe relationnel)
* **Backend** : Node.js, Express, TypeScript, Neo4j Driver (Bolt)
* **Client API** : Axios, avec un gestionnaire de file d'attente (rate-limiter) respectant la limite MusicBrainz de **1 req/seconde**.
* **Frontend** : React (Vite), TypeScript, Lucide React (Icônes)
* **Moteur de graphe** : vis-network (simulation physique ForceAtlas2)
* **Style** : Vanilla CSS / CSS Modules (Premium Dark Mode)
* **Conteneurisation** : Docker, Docker Compose

---

## 📐 Modèle de Données Graphe (Neo4j)

### Nœuds
* `(Artist)` : `mbid`, `name`, `type`, `country`, `beginDate`, `endDate`, `disambiguation`, `source`.
* `(Recording)` : `mbid`, `title`, `length`, `firstReleaseDate`.
* `(Release)` : `mbid`, `title`, `date`, `country`, `releaseType`.
* `(Label)` : `mbid`, `name`, `country`.
* `(Genre)` : `name`.
* `(Area)` : `mbid`, `name`, `type`.

### Relations
* `(:Artist)-[:PERFORMED]->(:Recording)` : L'artiste a interprété ce morceau.
* `(:Artist)-[:FEATURED_ON]->(:Recording)` : L'artiste apparaît en invité (featuring) sur le morceau.
* `(:Recording)-[:APPEARS_ON]->(:Release)` : Le morceau apparaît dans l'album.
* `(:Release)-[:RELEASED_BY]->(:Label)` : L'album est produit par la maison de disque.
* `(:Artist)-[:ASSOCIATED_WITH_GENRE]->(:Genre)` : Genre musical associé à l'artiste.
* `(:Artist)-[:FROM_AREA]->(:Area)` : Zone d'origine de l'artiste.
* `(:Release)-[:RELEASED_IN]->(:Area)` : Pays de parution de la release.
* `(:Artist)-[:COLLABORATED_WITH]->(:Artist)` : Relation directe calculée avec un attribut `count` représentant le nombre total de collaborations communes.

---

## ⚙️ Démarrage Rapide

Le projet est entièrement dockerisé pour une installation sans tracas.

### Prérequis
* Docker & Docker Compose installés sur votre machine.

### Étape 1 : Cloner et configurer l'environnement
Copiez le fichier de configuration d'environnement :
```bash
cp .env.example .env
```

### Étape 2 : Lancer l'application avec Docker
Exécutez la commande suivante à la racine du projet :
```bash
docker-compose up --build -d
```
Cette commande va lancer 3 conteneurs :
1. **musicgraph_db** (Neo4j) sur `http://localhost:7474` (Bolt sur le port `7687`)
2. **musicgraph_backend** (API Node) sur `http://localhost:3001`
3. **musicgraph_frontend** (Client Nginx) sur `http://localhost:80`

### Étape 3 : Peupler la base avec les données de démonstration (Seeding)
Une fois les conteneurs démarrés et la base prête (Neo4j prend environ 10 secondes à s'initialiser), exécutez le script de seeding :

Sur votre machine hôte (nécessite Node.js installé) :
```bash
cd backend
npm install
npm run seed
```

Ou directement depuis le conteneur backend :
```bash
docker exec -it musicgraph_backend npm run seed
```

### Étape 4 : Ouvrir l'application
* **Frontend Web** : Ouvrez votre navigateur sur [http://localhost](http://localhost) pour utiliser MusicGraph.
* **Console Neo4j Browser** : Ouvrez [http://localhost:7474](http://localhost:7474) (Identifiants : `neo4j` / `musicgraphpassword`).

---

## 📡 Endpoints de l'API

### Artistes
* `GET /api/artists` : Liste de tous les artistes importés en base.
* `GET /api/artists/:mbid` : Profil détaillé d'un artiste.
* `GET /api/artists/:mbid/recordings` : Morceaux associés à l'artiste (interprétations et featurings).
* `GET /api/artists/:mbid/releases` : Albums et releases associés.
* `GET /api/artists/:mbid/collaborations` : Collaborateurs directs triés par fréquence.
* `GET /api/artists/search?query=...` : Recherche d'artistes sur MusicBrainz.
* `POST /api/artists/import` : Importation d'un artiste via son `mbid` (Corps JSON : `{ "mbid": "..." }`).

### Graphes
* `GET /api/graph` : Graphe complet pour la visualisation globale (nœuds et relations mélangées).
* `GET /api/graph/collaborations` : Sous-graphe contenant uniquement les relations de collaboration directes entre artistes.
* `GET /api/graph/artists/:mbid` : Sous-graphe centré sur un artiste cible (1 saut).

### Statistiques Data
* `GET /api/stats/overview` : Nombre d'entités par type et volumes globaux.
* `GET /api/stats/top-collaborations` : Classement des duos ayant collaboré le plus souvent.
* `GET /api/stats/top-artists` : Centralité de degré (artistes les plus connectés du réseau).
* `GET /api/stats/top-genres` : Genres les plus populaires du graphe.

---

## 🧠 Choix de Conception et Qualité des Données

* **Gestion du Rate-Limit MusicBrainz** : L'API de MusicBrainz bloque les IPs effectuant plus d'une requête par seconde. Le backend implémente une classe `RequestQueue` qui gère les appels de manière asynchrone et séquentielle, en espaçant chaque requête de **1100ms** pour garantir la stabilité de l'importateur.
* **Dédoublonnage par MBID** : Toutes les écritures en base utilisent la clause Cypher `MERGE` adossée à l'identifiant unique international MusicBrainz (`mbid`), empêchant la création de doublons d'artistes, de morceaux ou de releases.
* **Visualisation réactive** : L'intégration directe de `vis-network` via les références React (`useRef`) évite les re-rendus inutiles et permet un calcul physique fluide, supportant l'affichage fluide de centaines de nœuds.
