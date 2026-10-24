# Focus 20h : installation sur iPad

L'appli est un site web qui s'installe sur l'écran d'accueil de l'iPad, comme une vraie appli.
**Toutes les données restent sur l'iPad.** Rien n'est envoyé sur internet : la mise en ligne sert seulement à rendre les fichiers accessibles à Safari.

## 1. Mettre les fichiers en ligne (une seule fois, gratuit) : GitHub Pages

1. Créer un compte sur <https://github.com>.
2. Cliquer sur **New repository** et le nommer `focus20h`. Le laisser en **Public** (obligatoire pour GitHub Pages gratuit ; seul le code de l'appli est visible, jamais les données).
3. Cliquer sur **uploading an existing file**, puis glisser **tout le contenu** du dossier `Focus20h` (y compris le dossier `icons`). Valider avec **Commit changes**.
4. Aller dans **Settings → Pages**. Dans « Branch », choisir `main` et `/ (root)`, puis **Save**.
5. Attendre 1 à 2 minutes. L'adresse s'affiche, du type `https://ton-pseudo.github.io/focus20h/`.

## 2. Installer sur l'iPad

1. Ouvrir l'adresse dans **Safari** (pas Chrome).
2. Toucher le bouton **Partager** (le carré avec une flèche).
3. Choisir **Sur l'écran d'accueil**, puis **Ajouter**.
4. Ouvrir Focus 20h depuis l'icône. Elle marche ensuite **même sans internet**.

> Il faut toujours utiliser l'icône de l'écran d'accueil, et non Safari : les données de l'appli installée sont séparées de celles de Safari.

## 3. Sauvegarder

Réglages (⚙️) → **Exporter mes données** → **Enregistrer dans Fichiers** (ou iCloud Drive).
Pour récupérer les données sur un nouvel iPad : installer l'appli, puis Réglages → **Importer**.

## Mettre à jour l'appli

1. Remplacer les fichiers modifiés sur GitHub.
2. Dans `sw.js`, changer le numéro `focus20h-v1` en `focus20h-v2` (puis v3, etc.).
3. Fermer et rouvrir l'appli deux fois sur l'iPad.

Les données ne sont pas touchées par une mise à jour.

## Personnaliser le contenu

Les citations, les idées de vidéos, les modèles de scripts, le guide et les exercices se trouvent dans `data.js`. On peut les modifier sans toucher au reste du code.
