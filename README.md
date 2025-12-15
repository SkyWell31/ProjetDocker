# 📦 Projet Docker Python – Stack Multi-Conteneurs (FastAPI + PostgreSQL + Nginx)

# Disclaimer : .md généré par IA comme je fais en entreprise. Vérification effectuée évidemment.

Ce projet constitue mon rendu pour le module **Docker / Conteneurisation**.  
Il répond à l’ensemble des exigences du guide projet :

✔ Stack multi-conteneurs  
✔ Séparation des réseaux (front / back)  
✔ Volume persistant pour PostgreSQL  
✔ Dockerfile multi-stage + multi-arch  
✔ Secrets Docker  
✔ Mode dev + mode “production locale”  
✔ Documentation complète permettant à un correcteur de tout relancer immédiatement  
✔ Preuves de communication entre conteneurs

---

# 🧱 Architecture du projet

```
projet-docker-python/
├── backend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── main.py
│   │   ├── db.py
│   │   ├── models.py
│   │   └── ...
│   ├── requirements.txt
│   └── .dockerignore
├── nginx/
│   └── nginx.conf
├── web/
│   ├── index.html
│   ├── style.css
│   └── game.js
├── compose.yaml
├── compose.prod.yaml
├── secrets/
│   ├── db_password.txt             (non commité)
│   └── db_password.txt.example     (commité)
├── .env.example
└── README.md
```

---

# 🌐 Réseaux Docker (exigence vérifiée)

Conformément au PDF :

| Réseau | Conteneurs membres |
|--------|--------------------|
| **front_net** | nginx ↔ backend |
| **back_net** | backend ↔ PostgreSQL |
| **La base n’est PAS exposée** | obligatoire |

Ainsi, seule l’API passe par Nginx :  
➡ *un seul point d’entrée* comme demandé.

---

# 🔐 Secrets (conforme au guide)

Exigences respectées :

- Le mot de passe PostgreSQL n’apparaît **ni dans le code**, ni dans les Dockerfiles  
- Géré via `POSTGRES_PASSWORD_FILE`
- Fichier stocké localement :

```bash
echo "monmotdepasse" > secrets/db_password.txt
```

- Le dossier `secrets/` est dans le `.gitignore`
- Un fichier modèle `db_password.txt.example` est inclus

---

# 🐳 Installation

## 1️⃣ Prérequis

- Docker Desktop  
- Docker Compose  
- (Optionnel) Python 3.12 pour développement hors container

## 2️⃣ Installer les fichiers secrets

```bash
cp secrets/db_password.txt.example secrets/db_password.txt
echo "motdepassefort" > secrets/db_password.txt
```

## 3️⃣ Variables d’environnement

```bash
cp .env.example .env
```

---

# 🚀 Lancement en mode **développement**

Le backend tourne en **hot reload**.

```bash
docker compose up --build
```

Accès :

| Service | URL |
|--------|------|
| Front Web | http://localhost:8080 |
| API | http://localhost:8080/api |
| Swagger | http://localhost:8080/api/docs |
| OpenAPI JSON | http://localhost:8080/openapi.json |
| DB interne | (non exposée, normal) |

---

# 🏭 Lancement en **production locale**

Le guide exige de simuler un mode prod via un fichier override ou compose.prod.yml :

Ici :

```bash
docker compose -f compose.yaml -f compose.prod.yaml up --build
```

Différences :
- Backend → image “prod” (multi-stage)
- Pas de hot reload
- Static files servis plus strictement

---

# 🧪 Tests obligatoires & preuves de fonctionnement

Les tests demandés par le guide sont fournis ici.

## ✔ 1. Preuve que l’API répond (Nginx → backend)

```bash
curl http://localhost:8080/api/health
```

Réponse attendue :

```json
{"status": "ok"}
```

## ✔ 2. Preuve que Swagger fonctionne

Ouvrir :

http://localhost:8080/api/docs

Swagger doit charger l’endpoint `/openapi.json` correctement.

## ✔ 3. Preuve que la DB répond au backend

Créer un item :

```bash
curl -X POST http://localhost:8080/api/items \
     -H "Content-Type: application/json" \
     -d '{"name":"alpha"}'
```

Récupérer la liste :

```bash
curl http://localhost:8080/api/items
```

Réponse attendue :

```json
[
  {"id":1, "name":"alpha"},
  {"id":2, "name":"bravo"},
  ...
]
```

## ✔ 4. Preuve de communication backend → DB → backend

```bash
docker compose exec backend sh -lc "python3 - <<'EOF'
from db import ping_db
print('DB OK' if ping_db() else 'DB FAIL')
EOF"
```

Résultat attendu :

```
DB OK
```

## ✔ 5. Preuve de persistance (exigence du guide)

➡ Le guide impose de démontrer la persistance via volumes Docker :

Procédure :

1. Ajouter un item  
2. Redémarrer :

```bash
docker compose restart db
```

3. Vérifier :

```bash
curl http://localhost:8080/api/items
```

➡ Les données doivent encore être présentes.

---

# 🏗 Multi-Stage & Multi-Architecture

Le Dockerfile backend inclut :

- `FROM python:alpine` (léger)
- Stage **dev**
- Stage **prod**
- Support multi-arch :

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t monimage:1.0 --push .
```

---

# 🔧 Stratégie de versioning (exigence du PDF)

Tagging :

| Branche | Tag |
|--------|------|
| main | `latest` |
| release/x.y | `x.y` |
| commits | `sha-xxxx` |

Registry compatible : **GitHub Container Registry (GHCR)**.

---

# 📚 Troubleshooting (demandé dans le PDF)

### ❌ Swagger renvoie 404 /openapi.json
✔ Solution : vérifier que Nginx contient :

```nginx
location /api/ {
    proxy_pass http://backend_upstream/;
}
location /openapi.json {
    proxy_pass http://backend_upstream/openapi.json;
}
```

### ❌ DB refuse la connexion
- Vérifier `secrets/db_password.txt`
- Vérifier que `backend` et `db` sont tous deux sur `back_net`

### ❌ Volume non persistant
- Supprimer le volume et recommencer :

```bash
docker volume rm projet-docker_python_pgdata
```

---
