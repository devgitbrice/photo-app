import AddButtonWithCamera from "@/components/AddButtonWithCamera";

export default function HomePage() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center space-y-4">
        <h1 className="text-2xl font-semibold">Photo App</h1>
        <p className="text-sm opacity-80">
          Ajoute une photo depuis l’appareil, puis renseigne un titre et une description.
        </p>

        <AddButtonWithCamera />
      </div>
    </main>
  );
}
