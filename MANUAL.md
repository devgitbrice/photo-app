# Manuel d'utilisation - MyDrive

## Table des matieres

1. [Presentation generale](#1-presentation-generale)
2. [Accueil et navigation](#2-accueil-et-navigation)
3. [MyDrive - Tableau de bord principal](#3-mydrive---tableau-de-bord-principal)
4. [Gestion des photos](#4-gestion-des-photos)
5. [Editeur de documents](#5-editeur-de-documents)
6. [Editeur de tableurs](#6-editeur-de-tableurs)
7. [Editeur de cartes mentales (Mindmap)](#7-editeur-de-cartes-mentales-mindmap)
8. [Editeur de scripts Python](#8-editeur-de-scripts-python)
9. [Editeur de presentations](#9-editeur-de-presentations)
10. [Planificateur de voyages](#10-planificateur-de-voyages)
11. [Assistant IA (ChatBot)](#11-assistant-ia-chatbot)
12. [Generation d'images par IA](#12-generation-dimages-par-ia)
13. [Synthese vocale (Text-to-Speech)](#13-synthese-vocale-text-to-speech)
14. [Gestion des tags](#14-gestion-des-tags)
15. [Recherche et filtrage](#15-recherche-et-filtrage)
16. [Export de fichiers](#16-export-de-fichiers)
17. [Parametres](#17-parametres)

---

## 1. Presentation generale

MyDrive est une suite de productivite complete accessible depuis un navigateur web. L'application permet de gerer et creer differents types de contenus :

- **Photos et scans** : capture, import et edition d'images
- **Documents** : editeur de texte riche avec export Word/PDF
- **Tableurs** : feuilles de calcul avec export Excel
- **Cartes mentales** : visualisation de concepts et d'idees
- **Scripts Python** : editeur de code avec execution dans le navigateur
- **Presentations** : creation de diaporamas avec export PowerPoint/PDF
- **Voyages** : planification d'itineraires et suivi de budget

L'application integre egalement un assistant IA conversationnel, la generation d'images par IA et la synthese vocale.

### Formats de fichiers pris en charge a l'import

| Type       | Formats acceptes          |
|------------|---------------------------|
| Images     | JPG, PNG, WebP, HEIC, HEIF |
| Documents  | PDF                       |

### Formats d'export disponibles

| Type de contenu | Formats d'export       |
|-----------------|------------------------|
| Documents       | DOCX (Word), PDF       |
| Tableurs        | XLSX (Excel)           |
| Presentations   | PPTX (PowerPoint), PDF |
| Photos/Scans    | Format original        |

---

## 2. Accueil et navigation

### Page d'accueil

La page d'accueil constitue le point d'entree de l'application. Elle offre un acces rapide aux fonctions principales :

- **Quick Scan** : lancer une capture photo rapide
- **Ajouter une photo** : ajouter une photo avec titre et observation
- **Acces aux fonctionnalites** : raccourcis vers la creation de documents, tableurs, presentations, etc.

### Navigation generale

Depuis n'importe quelle page, vous pouvez revenir au tableau de bord MyDrive qui centralise l'ensemble de vos fichiers et contenus.

---

## 3. MyDrive - Tableau de bord principal

MyDrive est le coeur de l'application. Il affiche tous vos contenus sous forme de galerie avec des cartes visuelles.

### Affichage des elements

Chaque element est represente par une carte affichant :

- Une icone indiquant le type de document
- Un apercu miniature (pour les photos et scans)
- Le titre du document
- La date de creation
- Les tags associes
- Un badge de couleur selon le type :
  - **Bleu** : Documents
  - **Jaune** : Scripts Python
  - **Violet** : Cartes mentales
  - **Vert** : Tableurs
  - **Orange** : Presentations
  - **Rose** : PDF / Scans
  - **Cyan** : Photos
  - **Bleu ciel** : Voyages

### Taille de la grille

Vous pouvez ajuster la taille d'affichage des cartes grace aux options de grille :

- **Petite** : affichage compact, plus d'elements visibles
- **Moyenne** : taille equilibree (par defaut)
- **Grande** : cartes larges avec apercu detaille

### Actions rapides depuis MyDrive

Le tableau de bord offre des boutons de creation rapide pour :

- Creer un **Document**
- Creer un **Script Python**
- Creer une **Carte mentale**
- Creer un **Tableur**
- Creer une **Presentation**
- Creer un **Voyage**
- Ajouter une **Photo**
- Acceder aux **Parametres**

### Gestion des elements

Pour chaque element, vous pouvez :

- **Ouvrir** : cliquer sur la carte pour acceder a l'editeur correspondant
- **Modifier le titre** : edition en ligne directement depuis la galerie
- **Supprimer** : suppression avec confirmation (supprime le fichier du stockage et l'entree en base de donnees)
- **Exporter** : telecharger le contenu dans le format adapte
- **Gerer les tags** : ajouter ou retirer des tags

---

## 4. Gestion des photos

### Ajouter une photo avec details

1. Depuis l'accueil ou MyDrive, cliquez sur **Ajouter une photo**
2. L'ajout se fait en trois etapes :
   - **Etape 1 - Photo** : prenez une photo avec la camera ou selectionnez un fichier depuis votre appareil
   - **Etape 2 - Observation** : redigez une description de ce que vous avez photographie
   - **Etape 3 - Titre** : donnez un titre a votre document
3. L'application valide que tous les champs sont remplis avant d'envoyer
4. La photo est automatiquement organisee par annee/mois dans le stockage

### Quick Scan (capture rapide)

Le mode Quick Scan est concu pour capturer rapidement plusieurs photos a la suite :

1. Depuis l'accueil, cliquez sur **Quick Scan**
2. La camera s'ouvre automatiquement
3. Capturez autant de photos que necessaire
4. Les photos sont enregistrees avec un titre et une observation vides (a completer plus tard depuis MyDrive)
5. A la fin, vous etes redirige vers MyDrive

### Sources de capture

Trois modes de capture sont disponibles :

- **Camera** : prise de vue directe avec l'appareil photo de votre dispositif
- **Bibliotheque photos** : selection depuis la galerie de votre appareil
- **Fichiers** : import depuis l'explorateur de fichiers

### Edition d'images

L'editeur d'images integre permet de :

- **Recadrer** : selectionnez la zone a conserver en faisant glisser les poignees de recadrage
- **Pivoter** : rotation par increments de 90 degres (0, 90, 180, 270 degres)

---

## 5. Editeur de documents

### Creer un document

1. Depuis MyDrive, cliquez sur **Creer Doc**
2. Saisissez un titre pour votre document
3. Redigez votre contenu dans l'editeur

### Structure du document

L'editeur utilise un systeme de blocs de contenu. Chaque bloc represente un paragraphe ou element du document.

### Fonctionnalites de l'editeur

- **Edition de texte riche** : mise en forme du texte (gras, italique, etc.)
- **Table des matieres** : generee automatiquement a partir des titres du document
- **Tags** : categorisez votre document avec des tags
- **Sauvegarde automatique** : vos modifications sont enregistrees automatiquement
- **Assistant IA** : utilisez le chatbot integre pour obtenir des suggestions de contenu que vous pouvez inserer directement dans votre document

### Export

- **DOCX** : export au format Microsoft Word
- **PDF** : export au format PDF avec mise en page

### Modifier un document existant

Depuis MyDrive, cliquez sur la carte du document pour l'ouvrir dans l'editeur.

---

## 6. Editeur de tableurs

### Creer un tableur

1. Depuis MyDrive, cliquez sur **Creer Table**
2. Saisissez un titre
3. Remplissez les cellules de votre feuille de calcul

### Fonctionnalites

- **Edition de cellules** : cliquez sur une cellule pour saisir ou modifier une valeur
- **Selection** : selectionnez des plages de cellules
- **Formules** : moteur de calcul integre pour les formules
- **Tags** : categorisez votre tableur
- **Export XLSX** : telecharger au format Microsoft Excel

---

## 7. Editeur de cartes mentales (Mindmap)

### Creer une carte mentale

1. Depuis MyDrive, cliquez sur **Creer Mindmap**
2. Saisissez un titre
3. Construisez votre carte mentale en ajoutant des noeuds et des connexions

### Fonctionnalites

- **Ajouter un noeud** : creez de nouveaux concepts sur la carte
- **Modifier un noeud** : editez le texte d'un noeud existant
- **Supprimer un noeud** : retirez un noeud de la carte
- **Connexions** : reliez les noeuds entre eux pour former des relations
- **Glisser-deposer** : reorganisez les noeuds en les deplacant sur le canevas
- **Mise en page automatique** : l'algorithme Dagre organise automatiquement les noeuds pour une lisibilite optimale
- **Sauvegarde automatique** : les modifications sont enregistrees automatiquement (avec un delai de 2 secondes)
- **Tags** : categorisez votre carte mentale

---

## 8. Editeur de scripts Python

### Creer un script Python

1. Depuis MyDrive, cliquez sur **Creer Python**
2. Saisissez un titre et une description
3. Ecrivez votre code Python dans l'editeur

### Execution du code

L'execution se fait entierement dans le navigateur grace a Pyodide (Python compile en WebAssembly). Aucun serveur n'est necessaire.

### Bibliotheques pre-installees

Les bibliotheques suivantes sont disponibles sans installation supplementaire :

- **pandas** : manipulation et analyse de donnees
- **matplotlib** : creation de graphiques et visualisations
- **numpy** : calcul numerique et tableaux

### Fonctionnalites

- **Editeur de code** : coloration syntaxique et edition du code Python
- **Console de sortie** : affichage en direct des resultats d'execution
- **Graphiques** : les visualisations matplotlib sont rendues directement dans le navigateur
- **Sauvegarde automatique** : le code est enregistre automatiquement
- **Tags** : categorisez votre script

---

## 9. Editeur de presentations

### Creer une presentation

1. Depuis MyDrive, cliquez sur **Creer Presentation**
2. Saisissez un titre
3. Construisez vos diapositives

### Types d'elements disponibles

Chaque diapositive peut contenir les elements suivants :

| Element         | Description                                     |
|-----------------|-------------------------------------------------|
| **Texte**       | Blocs de texte avec mise en forme riche         |
| **Images**      | Photos et illustrations                         |
| **Formes**      | 14 formes geometriques (rectangles, cercles, fleches, etoiles, etc.) |
| **Icones**      | Icones de la bibliotheque Lucide                |
| **Tableaux**    | Tableaux de donnees integres                    |
| **Blocs de code** | Extraits de code avec coloration syntaxique   |
| **Cartes mentales** | Mindmaps integrees dans les diapositives    |

### Manipulation des elements

Pour chaque element sur une diapositive, vous pouvez :

- **Positionner** : deplacer l'element sur la diapositive (coordonnees X, Y)
- **Redimensionner** : ajuster la largeur et la hauteur
- **Pivoter** : appliquer une rotation
- **Superposer** : gerer l'ordre d'affichage (z-index)
- **Verrouiller** : empecher les modifications accidentelles

### Mise en forme du texte

- Choix parmi 14+ familles de polices
- Effets de texte : ombres, contours, effets neon
- Couleurs et styles personnalisables

### Navigation entre diapositives

- Panneau lateral avec apercu miniature de chaque diapositive
- Navigation par clic ou fleches

### Mode presentation

Activez le mode diffusion pour projeter vos diapositives en plein ecran.

### Export

- **PPTX** : export au format Microsoft PowerPoint
- **PDF** : export en document PDF
- **Images** : export des diapositives individuelles en PNG

---

## 10. Planificateur de voyages

### Creer un voyage

Depuis MyDrive, creez un nouveau voyage pour planifier votre itineraire.

### Gestion des trajets

Pour chaque trajet de votre voyage, vous pouvez renseigner :

- **Point de depart** et **point d'arrivee**
- **Date et heure de depart** et **d'arrivee**
- **Mode de transport** (avion, train, voiture, etc.)
- **Nombre de personnes**
- **Prix unitaire** : le prix total est calcule automatiquement
- **Statut de paiement** : marquez un trajet comme paye ou non
- **Pieces jointes** : associez des fichiers de votre MyDrive (billets, confirmations, etc.)

### Gestion des logements

Pour chaque hebergement, vous pouvez renseigner :

- **Ville** et **lieu**
- **Date d'arrivee** et **date de depart**
- **Prix par nuit** : le prix total est calcule automatiquement
- **Statut de paiement** : marquez un hebergement comme paye ou non
- **Pieces jointes** : associez des fichiers de votre MyDrive (reservations, etc.)

### Suivi du budget

L'application calcule automatiquement les totaux pour les trajets et les logements, vous permettant de suivre le budget global de votre voyage.

---

## 11. Assistant IA (ChatBot)

### Acces

Le chatbot IA est accessible depuis les editeurs de contenu (documents, presentations, etc.).

### Fonctionnalites

- **Conversation** : posez des questions et recevez des reponses en temps reel
- **Historique** : l'historique de la conversation est conserve pendant la session
- **Insertion de contenu** : les reponses du chatbot peuvent etre inserees directement dans l'editeur en cours d'utilisation
- **Mise en forme** : les reponses sont formatees en Markdown pour une meilleure lisibilite

### Utilisation

1. Ouvrez le panneau du chatbot depuis un editeur
2. Saisissez votre question ou demande
3. Le chatbot repond avec du texte formate
4. Cliquez sur "Inserer" pour integrer la reponse dans votre document

---

## 12. Generation d'images par IA

### Fonctionnalite

L'application permet de generer des images a partir de descriptions textuelles grace a l'IA Google Gemini.

### Utilisation

1. Saisissez une description de l'image souhaitee (prompt)
2. L'IA genere une image correspondant a votre description
3. L'image est renvoyee en base64, prete a etre utilisee dans vos documents ou presentations

---

## 13. Synthese vocale (Text-to-Speech)

### Fonctionnalite

L'application integre la synthese vocale OpenAI pour convertir du texte en parole.

### Utilisation

1. Selectionnez ou saisissez le texte a lire
2. La synthese vocale lit le texte a haute voix
3. Vous pouvez arreter la lecture a tout moment

### Configuration

La configuration detaillee de la synthese vocale est accessible depuis la page **Parametres** (voir section 17).

---

## 14. Gestion des tags

### Principe

Les tags permettent de categoriser et organiser vos contenus dans MyDrive. Un element peut avoir plusieurs tags, et un tag peut etre associe a plusieurs elements.

### Ajouter un tag

1. Ouvrez un element ou selectionnez-le depuis MyDrive
2. Accedez a la gestion des tags
3. Saisissez le nom du tag (il sera automatiquement converti en minuscules)
4. Validez pour creer et associer le tag

### Retirer un tag

Depuis la gestion des tags d'un element, cliquez sur le tag a retirer.

### Filtrer par tags

Depuis MyDrive, utilisez le panneau de filtrage par tags pour afficher uniquement les elements portant un tag specifique. Vous pouvez egalement filtrer les elements sans aucun tag.

---

## 15. Recherche et filtrage

### Recherche textuelle

Depuis MyDrive, utilisez la barre de recherche pour trouver des elements par :

- **Titre** : le nom du document
- **Observation** : la description associee

La recherche est insensible a la casse (majuscules/minuscules).

### Filtrage par type de document

Cliquez sur les filtres de type pour afficher uniquement une categorie de contenu :

| Filtre        | Contenu affiche             |
|---------------|-----------------------------|
| Doc           | Documents texte             |
| Python        | Scripts Python              |
| Mindmap       | Cartes mentales             |
| Table         | Tableurs                    |
| Presentation  | Presentations               |
| PDF/Scan      | Documents scannes et PDF    |
| Photo         | Photographies               |
| Voyage        | Planificateurs de voyage    |

Le nombre d'elements pour chaque type est affiche a cote du filtre.

### Filtrage par tags

Selectionnez un ou plusieurs tags pour filtrer les elements. La navigation dans la liste des tags est possible avec les fleches haut/bas du clavier.

---

## 16. Export de fichiers

### Exporter depuis MyDrive

1. Localisez l'element a exporter dans la galerie
2. Ouvrez le menu d'export de l'element
3. Choisissez le format souhaite
4. Le fichier est telecharge automatiquement sur votre appareil

### Formats disponibles par type de contenu

| Type de contenu   | Formats d'export disponibles |
|-------------------|------------------------------|
| Document          | DOCX, PDF                    |
| Tableur           | XLSX                         |
| Presentation      | PPTX, PDF, PNG               |
| Photo / Scan      | Format original (JPG, PNG, etc.) |
| Carte mentale     | --                           |
| Script Python     | --                           |
| Voyage            | --                           |

### Nommage des fichiers

Les fichiers exportes sont nommes a partir du titre de l'element, avec nettoyage automatique des caracteres speciaux pour assurer la compatibilite avec tous les systemes d'exploitation.

---

## 17. Parametres

### Acces

Depuis MyDrive, cliquez sur le bouton **Parametres** pour acceder a la page de configuration.

### Synthese vocale (TTS)

#### Choix du modele

| Modele            | Description                                        |
|-------------------|----------------------------------------------------|
| GPT-4o Mini TTS   | Derniere generation, supporte les instructions vocales |
| TTS-1             | Standard, faible latence                           |
| TTS-1 HD          | Haute qualite audio                                |

#### Choix de la voix

11 voix sont disponibles :

| Voix     | Caracteristique            |
|----------|----------------------------|
| Alloy    | Neutre, polyvalente        |
| Ash      | Calme, composee            |
| Ballad   | Douce, melodique           |
| Coral    | Claire, chaleureuse        |
| Echo     | Masculine, profonde        |
| Fable    | Expressive, narrative      |
| Onyx     | Grave, autoritaire         |
| Nova     | Jeune, energique           |
| Sage     | Sage, reflechie            |
| Shimmer  | Legere, brillante          |
| Verse    | Polyvalente, equilibree    |

#### Vitesse de lecture

- Plage : de **0.25x** (tres lent) a **4.0x** (tres rapide)
- Valeur par defaut : **1.0x**

#### Format audio

Formats de sortie disponibles : MP3, Opus, AAC, FLAC, WAV, PCM.

#### Instructions vocales

Disponible uniquement avec le modele **GPT-4o Mini TTS**. Permet de personnaliser le ton, l'emotion et le rythme de la voix avec des directives textuelles (jusqu'a 4096 caracteres).

#### Tester la configuration

Cliquez sur le bouton **Tester** pour ecouter un extrait avec les parametres actuels. Utilisez le bouton **Stop** pour arreter la lecture.

#### Reinitialiser les parametres

Cliquez sur **Reinitialiser les parametres par defaut** pour restaurer la configuration initiale.

### Persistance des parametres

Tous les parametres sont sauvegardes localement dans votre navigateur (localStorage). Ils sont automatiquement restaures a chaque ouverture de l'application.

---

## Annexe : Raccourcis et astuces

- **Navigation par clavier** : utilisez les fleches haut/bas pour parcourir la liste des tags dans le panneau de filtrage
- **Sauvegarde automatique** : les editeurs de documents et de cartes mentales sauvent automatiquement vos modifications (delai de 2 secondes pour les cartes mentales)
- **Camera directe** : en mode Quick Scan, la camera s'ouvre automatiquement pour une capture immediate
- **Multi-tags** : un element peut porter plusieurs tags pour un classement transversal
- **Python dans le navigateur** : l'execution Python se fait entierement cote client, sans envoyer votre code a un serveur
