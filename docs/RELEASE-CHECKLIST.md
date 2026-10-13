# Check-list de publication — ATS CV Studio

À dérouler **sur une machine Windows propre** (idéalement une VM ou un second compte Windows, sans Rust ni Node)
avant de publier le brouillon de release. Les trois livrables doivent tous passer.

Version testée : `____` · Date : `____` · Testeur : `____` · Windows : `____` (10 / 11)

## 0. Préparation (une fois par version)

- [ ] `pnpm check:versions` affiche `OK` (même version dans 6 fichiers + CHANGELOG daté).
- [ ] Le tag `vX.Y.Z` correspond à cette version. Le workflow **Release** est vert.
- [ ] Les 4 fichiers du brouillon de release sont présents : `.msi`, `-setup.exe`, `_portable.zip`, `SHA256SUMS.txt`.
- [ ] Les empreintes correspondent : `Get-FileHash <fichier> -Algorithm SHA256` est identique à `SHA256SUMS.txt`.
- [ ] Préparer un CV de test de **2 pages** (EN) et un CV en **arabe** (RTL), plus un PDF ou DOCX à importer.

> Les binaires ne sont pas signés : SmartScreen peut afficher « Windows a protégé votre ordinateur »
> (_Informations complémentaires → Exécuter quand même_). C'est attendu tant qu'il n'y a pas de certificat de signature.

## 1. Installateur MSI

- [ ] Installation : s'effectue sans erreur, un raccourci est créé.
- [ ] Propriétés du `.exe` installé (clic droit → Détails) : version = `X.Y.Z`.
- [ ] _Paramètres → Applications_ : « ATS CV Studio » apparaît avec la bonne version.
- [ ] Premier lancement : la fenêtre s'ouvre, aucune erreur WebView2, l'interface est dans la bonne langue.
- [ ] Les données sont créées sous `%APPDATA%\com.atscvstudio.desktop\ATS_CV_Studio` (et **pas** à côté de l'exe).
- [ ] Désinstallation depuis _Paramètres → Applications_ : l'application disparaît.
- [ ] **Mise à jour** : installer l'ancienne version (1.2.0), créer un CV, puis installer la nouvelle par-dessus : le CV est toujours là.

## 2. Installateur NSIS (`-setup.exe`)

- [ ] Installation : s'effectue sans erreur, un raccourci est créé.
- [ ] Propriétés de l'`.exe` installé : version = `X.Y.Z`.
- [ ] _Paramètres → Applications_ : version correcte.
- [ ] Premier lancement correct (comme pour le MSI).
- [ ] Les données sont sous `%APPDATA%\com.atscvstudio.desktop\ATS_CV_Studio`.
- [ ] Désinstallation propre. (Ne pas laisser MSI **et** NSIS installés en même temps : tester l'un après l'autre.)
- [ ] **Mise à jour** par-dessus une version précédente : les CV existants sont conservés.

## 3. Version portable (`_portable.zip`)

- [ ] Extraire le ZIP dans un dossier **sans droits administrateur** (ex. Bureau ou clé USB). Le dossier contient `ATS_CV_Studio_Portable.exe` et `portable.json`.
- [ ] Lancer l'exe : l'application s'ouvre sans installation.
- [ ] Créer un CV : un dossier **`ATSData`** apparaît **à côté de l'exe** et contient le CV.
- [ ] Rien n'est écrit dans `%APPDATA%\com.atscvstudio.desktop\ATS_CV_Studio` pendant l'utilisation du portable (dossier absent ou inchangé).
- [ ] Fermer, **déplacer tout le dossier** ailleurs (ou sur une autre machine), relancer : le CV est toujours là.
- [ ] Sans `portable.json` à côté de l'exe, l'application bascule en mode normal (données dans `%APPDATA%`). Remettre le fichier ensuite.
- [ ] Une seule instance : relancer l'exe alors qu'il est ouvert ramène la fenêtre existante au premier plan.
- [ ] Propriétés de l'exe : version = `X.Y.Z`.

## 4. Fonctions communes (à faire avec le MSI **ou** le NSIS, puis refaire rapidement avec le portable)

- [ ] Import d'un PDF et d'un DOCX : l'assistant de relecture s'ouvre et le CV est créé.
- [ ] Changer de template (au moins 3 familles) : l'aperçu se met à jour.
- [ ] Langue FR / EN / AR : l'interface passe en RTL pour l'arabe, sans élément coupé.
- [ ] Export **Word** : le fichier s'ouvre dans Word, titres et dates corrects.
- [ ] Export **PDF** du CV de **2 pages** avec des marges 12 / 16 / 20 mm : les marges sont respectées sur **chaque page** (point à valider en priorité : c'est le correctif n° 1 de l'audit).
- [ ] Le texte du PDF est sélectionnable (copier-coller d'une ligne dans un éditeur de texte).
- [ ] Fermer et rouvrir : l'enregistrement automatique a conservé les modifications.

## 5. Résultat

- [ ] MSI validé · [ ] NSIS validé · [ ] Portable validé
- Anomalies trouvées (version, étape, capture) :

  ```
  ```

Si tout est validé : publier le brouillon de release. Sinon : corriger, incrémenter le patch (`X.Y.Z+1`), refaire `pnpm check:versions` et un nouveau tag.
