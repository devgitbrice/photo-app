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
 */
export type MyDriveItem = {
  id: string;

  title: string;
  observation: string;

  image_path: string;
  image_url: string;

  content: string;
  doc_type: "scan" | "doc";

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
