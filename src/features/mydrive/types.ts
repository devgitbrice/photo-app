/**
 * Représente un tag
 */
export type Tag = {
  id: string;
  name: string;
  created_at: string;
};

/**
 * Représente une ligne de la table Supabase "MyDrive"
 * Supporte Scan, Doc, Mindmap, Table et Présentation
 */
export type MyDriveItem = {
  id: string;

  title: string;
  observation: string; // Sert de description

  image_path: string;
  image_url: string;

  content: string; // Contenu JSON ou HTML selon le type
  doc_type: "scan" | "doc" | "mindmap" | "table" | "presentation";

  created_at: string; // ISO string (timestamptz)

  tags: Tag[];
};

/**
 * Props communes pour les composants d'affichage MyDrive
 */
export type MyDriveListProps = {
  items: MyDriveItem[];
  allTags: Tag[];
};