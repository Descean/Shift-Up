# SHIFT UP — Site Officiel

> Cabinet de conseil stratégique et solutions numériques
> Excellence • Innovation • Performance
> **Transforming Business, Shaping Future**

---

## Stack technique

| Couche | Technologie |
|--------|------------|
| Front-end | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Animation | Framer Motion |
| Auth | NextAuth.js v4 (JWT + Google OAuth) |
| Base de données | PostgreSQL via Supabase + Prisma ORM |
| Paiements | FedaPay (Mobile Money) + Stripe (cartes) |
| Chatbot IA | Google Gemini 1.5 Flash |
| IA Dashboard | Claude API (Anthropic) |
| Email | Resend / Brevo |
| Déploiement | Vercel (front) + Railway/Render (back) + Cloudflare CDN |
| Analytics | PostHog + Google Analytics 4 |

---

## Structure du projet

```
shift-up-website/
├── app/
│   ├── (public)/           # Pages publiques (accueil, services, contact...)
│   ├── (auth)/             # Connexion, inscription
│   ├── dashboard/          # Espaces clients (client, apporteur, étudiant, admin)
│   ├── api/                # Routes API (auth, chat, contact, payments...)
│   ├── layout.tsx          # Layout racine
│   ├── globals.css         # Styles globaux
│   └── sitemap.ts          # Sitemap XML dynamique
├── components/
│   ├── layout/             # Header, Footer
│   ├── home/               # Sections page d'accueil
│   ├── ui/                 # Composants réutilisables (Button, Card, Badge)
│   ├── dashboard/          # Composants dashboards
│   ├── chatbot/            # Widget chatbot IA
│   └── providers/          # AuthProvider (NextAuth)
├── lib/
│   ├── auth.ts             # Configuration NextAuth
│   ├── prisma.ts           # Client Prisma singleton
│   ├── supabase.ts         # Client Supabase
│   └── utils.ts            # Fonctions utilitaires
├── types/
│   └── index.ts            # Types TypeScript globaux
├── prisma/
│   └── schema.prisma       # Schéma base de données complet
├── public/
│   ├── manifest.json       # PWA manifest
│   ├── robots.txt          # SEO robots
│   └── assets/             # Images, logos
├── middleware.ts            # Auth middleware (protection routes)
├── .env.example            # Variables d'environnement documentées
├── tailwind.config.ts      # Configuration Tailwind
└── next.config.ts          # Configuration Next.js
```

---

## Installation

### Prérequis
- Node.js >= 18
- pnpm ou npm ou yarn
- Compte Supabase (gratuit)
- Comptes : Google Cloud, Resend, FedaPay, Gemini AI

### 1. Cloner et installer

```bash
git clone https://github.com/shiftup/website.git
cd website
npm install
```

### 2. Variables d'environnement

```bash
cp .env.example .env.local
```

Remplir toutes les valeurs dans `.env.local` (voir section Variables d'environnement).

### 3. Base de données

```bash
# Générer le client Prisma
npm run db:generate

# Pousser le schéma vers Supabase
npm run db:push

# Ou créer une migration
npm run db:migrate
```

### 4. Démarrer en développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

---

## Variables d'environnement

Voir `.env.example` pour la liste complète documentée.

Variables **obligatoires** pour le démarrage :

```env
NEXTAUTH_SECRET=<random 32 chars>
NEXTAUTH_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
DATABASE_URL=postgresql://...

GOOGLE_AI_API_KEY=xxx          # Chatbot Gemini
ANTHROPIC_API_KEY=xxx          # Dashboard IA Claude
```

Variables pour les paiements :

```env
NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY=xxx
FEDAPAY_SECRET_KEY=xxx
FEDAPAY_ENVIRONMENT=sandbox

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

## Déploiement

### Vercel (recommandé)

1. Connecter le dépôt GitHub à Vercel
2. Ajouter toutes les variables d'environnement dans les settings Vercel
3. Déployer — Vercel détecte automatiquement Next.js

```bash
npm run build   # Vérifier le build en local avant déploiement
```

### Configuration DNS (Cloudflare)

```
Type  Nom    Valeur                TTL
A     @      76.76.21.21           Auto
CNAME www    cname.vercel-dns.com  Auto
```

### Stripe Webhooks

Configurer l'URL webhook dans le dashboard Stripe :
```
https://shiftup.bj/api/payments/webhook/stripe
```

### FedaPay Webhooks

Configurer dans le dashboard FedaPay :
```
https://shiftup.bj/api/payments/webhook/fedapay
```

---

## Profils utilisateurs

| Profil | Accès | Requis |
|--------|-------|--------|
| **Client** | Prestations, suivi, affiliation, messagerie | Email + mot de passe |
| **Apporteur** | Catalogue, commissions, classement | IFU obligatoire |
| **Étudiant** | Ressources, micro-tâches, badges | Carte étudiante |
| **Admin** | CMS, analytics, finances, gestion | Compte admin |
| **Developer** | CMS, analytics, gestion (sans finances) | Compte dev |

---

## Système d'affiliation & fidélité

- Chaque client reçoit un **code unique** `SU-ANNÉE-XXXXX`
- **5 niveaux d'étoiles** avec avantages cumulatifs
- Versement des gains le **25 décembre** chaque année
- Apporteurs : classement trimestriel sur 3 ans (Bronze → Diamant)

---

## Paiements

- **Acompte 40%** requis à la souscription
- **Solde 60%** à la livraison
- **Factures PDF** automatiques avec IFU et RCCM
- Passerelles : FedaPay (XOF) + Stripe (EUR/USD)

---

## Mobile & PWA

- Dashboard entièrement responsive (testé iPhone 8 Plus)
- Sidebar mobile : drawer slide-in + barre de navigation bottom (5 onglets)
- PWA installable : `manifest.json` avec icônes maskable, shortcuts (Dashboard, Services, Contact)
- Support iOS : meta tags Apple, `viewportFit=cover`, `safe-area-inset-bottom`
- **Icônes à générer** : placer les PNG dans `/public/icons/` (72→512px via maskable.app)

---

## Sécurité

- Auth JWT + refresh tokens (httpOnly cookies via NextAuth)
- OAuth 2.0 Google
- Protection CSRF intégrée (Next.js)
- Rate limiting recommandé via Upstash Redis
- Chiffrement AES-256 des données sensibles
- Audit logs sur toutes les actions critiques
- Sauvegardes Supabase automatiques (incluses)

---

## Informations légales SHIFT UP

| Champ | Valeur |
|-------|--------|
| Raison sociale | SHIFT UP |
| Dirigeant | La Direction SHIFT UP |
| RCCM | RB/ABC/25 A 124734 |
| IFU | 0202113434116 |
| Date immatriculation | 30 mai 2025 |
| Siège | Abomey-Calavi, Atlantique, Bénin |
| Email | shiftup.eudes@gmail.com |
| Tél | (+229) 01 95 03 50 99 |

---

## Support & Contact

- **Email** : shiftup.eudes@gmail.com
- **WhatsApp** : (+229) 01 95 03 50 99
- **RDV** : Page [/contact](https://shiftup.bj/contact) (Calendly à configurer)

---

*© 2025 SHIFT UP — Tous droits réservés*
