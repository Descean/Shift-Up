**Prompt pour le développement d’un outil d’appariement automatique entre un devis Excel et un répertoire de prix PDF**

**Contexte et objectif**



Vous devez développer un outil logiciel (en Python) destiné à automatiser le chiffrage de devis de travaux publics au Bénin. L’outil prendra en entrée :



Un fichier Excel (format .xlsx) représentant un devis type « BTP ». Ce fichier contient une liste de lignes de prestations, avec généralement :



Colonne A : Désignation des travaux (texte descriptif, parfois long et contenant des spécifications techniques).



Colonne B : Unité de mesure (ex: m², m³, U, FF, ml).



Colonne C : Quantité (optionnelle).



Colonnes D et E : Parfois vides, parfois contenant des codes ou prix partiels.



Un fichier PDF volumineux (environ 848 pages) : le « e-Répertoire des Prix de Référence ». Il s'agit de la nomenclature officielle des articles éligibles aux marchés publics. Sa structure est tabulaire, avec pour chaque article :



CODE : Identifiant unique de l'article.



FAMILLE : Catégorie de l'article.



DESIGNATIONS : Nom de l'article.



SPECIFICATIONS TECHNIQUES : Descriptif détaillé (matériaux, dimensions, performances, etc.).



UNITE DE MESURE : L'unité dans laquelle l'article est facturé.



BI : Borne inférieure du prix.



BS : Borne supérieure du prix (c'est cette valeur que nous voulons extraire).



L'objectif final est de produire le même fichier Excel, enrichi de deux nouvelles colonnes :



Colonne D : La valeur de la borne supérieure (BS) correspondant à la meilleure correspondance trouvée dans le répertoire.



Colonne E : Le CODE de l'article correspondant.



Le cœur du problème est de trouver, pour chaque ligne du devis, l'article le plus pertinent dans le répertoire, en se basant sur la similarité sémantique des descriptions, la cohérence des unités et, le cas échéant, des spécifications techniques.



Fonctionnalités détaillées de l'outil

1\. Extraction et structuration des données du PDF

Le PDF est la source de vérité. Son extraction doit être robuste.



1.1. Analyse du PDF : Utiliser une bibliothèque comme pdfplumber (recommandée) ou camelot pour identifier et extraire les tableaux. Le PDF peut avoir des tableaux s'étendant sur plusieurs pages, avec des en-têtes répétés. Il faut être capable de reconstituer chaque ligne d'article.



1.2. Nettoyage des données extraites :



Supprimer les espaces superflus en début et fin de chaîne.



Gérer les retours à la ligne à l'intérieur d'une cellule en les remplaçant par un espace.



Convertir les champs BI et BS en nombres flottants. Les prix sont souvent formatés avec des espaces (ex: 1 200 000). Il faut supprimer ces espaces avant conversion.



Normaliser les unités de mesure : créer un dictionnaire de correspondance pour harmoniser les variations (ex: "m²" → "m2", "m³" → "m3", "ml" → "m", "u" → "U", "unité" → "U").



1.3. Structuration finale : Stocker le résultat dans une structure de données exploitable, par exemple une liste de dictionnaires ou un DataFrame Pandas, avec les clés : code, famille, designation, specs, unite\_norm, bi, bs. Sauvegarder cette structure dans un fichier (CSV, JSON ou Pickle) pour éviter de re-parser le PDF à chaque exécution de l'outil.



2\. Prétraitement des lignes du devis (Excel)

2.1. Chargement du fichier : Utiliser pandas pour charger le fichier Excel.



2.2. Nettoyage de la description : Pour chaque ligne, appliquer un nettoyage similaire à celui des données du répertoire : mise en minuscules, suppression de la ponctuation excessive, normalisation des unités si elles apparaissent dans la description. Cette chaîne nettoyée sera utilisée pour la recherche.



2.3. Normalisation de l'unité : Appliquer le même dictionnaire de normalisation des unités à la valeur de la colonne B du devis.



3\. Moteur de recherche et de scoring

C'est le module le plus critique. Il doit implémenter une stratégie de recherche à plusieurs niveaux pour maximiser la pertinence.



3.1. Préparation de l'index de recherche :



Créer un champ "texte de recherche" pour chaque article du répertoire en concaténant sa designation et ses specs (après nettoyage).



Utiliser sklearn.feature\_extraction.text.TfidfVectorizer pour créer une matrice TF-IDF sur ce champ. Le TF-IDF est efficace pour trouver des documents similaires en fonction des mots importants.



Définir une liste de mots vides (stop words) personnalisés pour le contexte des travaux publics (ex: "fourniture", "pose", "compris", "sujétions", "toutes", "ensemble", "type", "y", "les", "des", etc.). Ces mots seront ignorés par le vectorizer pour améliorer la pertinence.



3.2. Fonction de scoring :

Pour une ligne de devis donnée (avec sa description\_nettoyee et son unite\_norm), le processus de scoring est le suivant :



Recherche des candidats initiaux : Transformer la description du devis avec le TfidfVectorizer entraîné, puis calculer la similarité cosinus avec tous les articles du répertoire. Récupérer les N premiers articles (par exemple, les 20 ou 50 meilleurs) pour limiter le travail de scoring fin.

Scoring fin basé sur des heuristiques : Pour chacun des candidats, calculer un score composite (entre 0 et 1) basé sur plusieurs critères pondérés.

Pondération suggérée : La somme des pondérations doit être 1.

Critère 1 : Similarité textuelle (poids ~0.5) : Utiliser le score de similarité cosinus obtenu à l'étape précédente. C'est la base de la pertinence.

Critère 2 : Correspondance des unités (poids ~0.3) :

Si l'unité normalisée du devis est identique à celle de l'article candidat → score = 1.

Si les unités sont compatibles mais non identiques (ex: devis en m² pour un article en m, ou devis en U pour un article en FF) → score = 0.5. Une table de compatibilité devra être définie.

Si les unités sont totalement incompatibles (ex: m² vs kg) → score = 0. Ce candidat doit être fortement pénalisé, voire rejeté.

Critère 3 : Présence de spécifications clés (poids ~0.2) :

Cette étape est déclenchée si la description du devis contient des informations très spécifiques comme 350kg/m3, ep=15cm, anti-dérapant, etc.

On vérifie si ces chaînes de caractères (ou des formes normalisées) sont présentes dans le champ specs de l'article candidat. Le score est le pourcentage de ces spécifications trouvées.

Calcul du score final : score\_final = (poids1 \* score\_text) + (poids2 \* score\_unite) + (poids3 \* score\_specs).

3.3. Sélection de la meilleure correspondance :



Le candidat avec le score\_final le plus élevé est retenu, à condition qu'il dépasse un seuil de confiance configurable (ex: 0.4).



Si aucun candidat ne dépasse le seuil, la ligne est considérée comme sans correspondance. L'outil pourra en journaliser la liste pour une vérification manuelle ultérieure.



4\. Intégration et enrichissement du fichier Excel

4.1. Ajout des colonnes : Vérifier si les colonnes BS et CODE existent déjà. Si non, les ajouter (par exemple en position D et E). Si elles existent déjà, les données seront écrasées.



4.2. Remplissage : Pour chaque ligne du DataFrame, écrire le bs et le code de la meilleure correspondance trouvée. Si aucune correspondance, laisser vide.



4.3. Sauvegarde : Sauvegarder le DataFrame enrichi dans un nouveau fichier Excel, par exemple en ajoutant le suffixe \_complete au nom du fichier original.



5\. Gestion des cas particuliers

Codes présents dans le devis : Avant toute recherche, l'outil doit vérifier si la colonne E (ou toute autre colonne) contient déjà un code du répertoire. Si oui, on peut faire une recherche directe par code, ce qui est prioritaire sur la recherche par similarité.



Descriptions très longues : Le TF-IDF gère naturellement les textes longs. L'étape de filtrage des candidats initiaux (étape 3.2.1) est cruciale pour rester performant.



Synonymes : Intégrer un dictionnaire de synonymes pour améliorer le matching. Par exemple, acajou ↔ acadjou, bac alu ↔ bac acier alu, faîence ↔ faïence. Ce dictionnaire peut être utilisé lors du prétraitement pour remplacer les termes par leur forme canonique.



Prix forfaitaires (FF) : Le scoring des unités doit prendre en compte que FF (Forfait) peut correspondre à U (Unité) ou à un article de type "Ensemble" dans le répertoire.



Contraintes techniques et de performance

Langage : Python 3.9+.



Bibliothèques principales :



pdfplumber : Pour l'extraction des tableaux du PDF.



pandas : Pour la manipulation des données (devis et répertoire).



openpyxl : Pour la lecture et l'écriture des fichiers Excel.



scikit-learn : Pour TfidfVectorizer et le calcul de similarité cosinus.



numpy : Pour les calculs numériques.



re : Pour les expressions régulières de nettoyage.



Performance : Le PDF contient environ 9000 articles. Une fois extrait, la matrice TF-IDF et les recherches doivent être rapides. Le calcul de similarité avec tous les articles pour chaque ligne de devis est acceptable (O(n\*m) où n est le nombre d'articles et m le nombre de lignes). Pour un devis de 200 lignes, cela reste instantané.



Configuration : L'outil doit lire ses paramètres (seuil de confiance, pondérations, liste de mots vides, dictionnaire de synonymes) depuis un fichier de configuration externe (par exemple, config.yaml) pour être facilement ajustable sans modifier le code.



Livrables attendus

Code source : Un script principal, par exemple match\_devis.py, contenant les fonctions pour chaque étape (extraction PDF, prétraitement, matching, enrichissement Excel). Le code doit être clair, commenté (en français) et structuré.



Fichier de configuration : Un fichier config.yaml (ou JSON) avec les paramètres modifiables (seuil de similarité, poids des critères, liste des mots vides, dictionnaire de synonymes, etc.).



Données extraites du répertoire : Le script principal doit avoir une option pour ne faire qu'extraire les données du PDF et les sauvegarder (par exemple, --extract-only). Un fichier prix\_reference.pkl (ou .json) sera produit et utilisé pour les exécutions ultérieures, évitant ainsi de re-parser le PDF à chaque fois.



Documentation : Un fichier README.md expliquant :



Comment installer les dépendances (pip install -r requirements.txt).



Comment utiliser le script (exemple de ligne de commande).



La structure attendue du fichier Excel d'entrée.



Comment interpréter la sortie.



Comment modifier la configuration.



Exemple d'utilisation (ligne de commande)

bash

\# Première exécution : extraction du PDF (long)

python match\_devis.py --extract-pdf e-repertoire.pdf --output-db prix\_db.pkl



\# Exécutions suivantes : traitement d'un devis

python match\_devis.py --devis mon\_devis.xlsx --db prix\_db.pkl --output mon\_devis\_complete.xlsx



