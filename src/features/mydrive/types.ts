/**
 * Représente une ligne de la table Supabase "MyDrive"
 */
export type MyDriveItem = {
  id: string;

  title: string;
  observation: string;

  image_path: string;
  image_url: string;

  created_at: string; // ISO string (timestamptz)
};

/**
 * Props communes pour les composants d’affichage MyDrive
 */
export type MyDriveListProps = {
  items: MyDriveItem[];
};
