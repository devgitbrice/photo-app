"use client";

export default function EditVoyageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-dvh w-full bg-neutral-950 text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <h2 className="text-xl font-semibold text-red-400">
          Erreur lors du chargement du voyage
        </h2>
        <p className="text-sm text-neutral-400">
          {error.message || "Une erreur inattendue est survenue."}
        </p>
        {error.digest && (
          <p className="text-xs text-neutral-600">Digest: {error.digest}</p>
        )}
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={reset}
            className="px-4 py-2 text-sm bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors"
          >
            Reessayer
          </button>
          <a
            href="/mydrive"
            className="px-4 py-2 text-sm border border-neutral-700 text-neutral-300 hover:text-white rounded-lg transition-colors"
          >
            Retour a MyDrive
          </a>
        </div>
      </div>
    </main>
  );
}
