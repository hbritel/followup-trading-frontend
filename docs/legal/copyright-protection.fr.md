# Protection du code par le droit d'auteur — note de référence (frontend)

> **Avertissement** : note interne de synthèse, **pas un avis juridique**.

Note complète et détaillée maintenue côté backend :
`hbritel/followup_trading` → `docs/legal/copyright-protection.fr.md`.

Ce fichier en est un résumé pour le dépôt frontend.

## Essentiel

- Le code source est **protégé automatiquement** par le droit d'auteur dès sa
  création (CPI L112-2 13°, L122-6) et internationalement via la **Convention
  de Berne** (~180 pays).
- **Pas protégé** : idées, fonctionnalités, algorithmes (CJUE *SAS Institute*,
  C-406/10, 2012). Un concurrent peut réimplémenter la fonctionnalité ; il ne
  peut pas copier le code.
- Pour protéger un mécanisme technique : **brevet** (logiciels « en tant que
  tels » non brevetables en EU — art. 52 CBE).

## Renforcer la preuve d'antériorité

| Moyen | Coût | Valeur |
|---|---|---|
| Dépôt APP | ~50–150 € | Reconnu FR/EU |
| Enveloppe Soleau (INPI) | 15 € | Bonne preuve de date |
| US Copyright Office | ~65 $ | **Obligatoire pour poursuivre aux USA** |
| Constat huissier | ~200 € | Forte valeur probante |

## Spécifique frontend

- Le code TypeScript / React est protégé au même titre que le backend.
- **Attention aux licences npm transitives** (audit avant tout dépôt formel) :
  un AGPL transitif peut imposer ses contraintes à toute redistribution.
- Logique métier sensible : **garder côté serveur**, ne pas l'exposer dans le
  bundle JS (le code client est lisible par tout utilisateur).
- Interfaces graphiques **originales** sont protégées (sélection, agencement,
  identité visuelle) — utiles en cas de clone visuel manifeste.

## TODO post-dev

Voir `docs/TODO.md` → section « Propriété intellectuelle ».
