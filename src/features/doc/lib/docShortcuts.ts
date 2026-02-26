/**
 * Handle doc editor keyboard shortcuts.
 * Returns true if the event was handled (should preventDefault).
 *
 * Shortcuts:
 *   Cmd+B  → bold
 *   Cmd+I  → italic
 *   Cmd+U  → underline
 *   Cmd+J  → highlight yellow
 *   Cmd+T  → highlight yellow (background)
 *   Cmd+A  → select all
 *   Cmd+Z  → undo
 *   Alt+Cmd+& / Alt+Cmd+1 → H1
 *   Alt+Cmd+é / Alt+Cmd+2 → H2
 *   Alt+Cmd+" / Alt+Cmd+3 → H3
 *
 * Native (not intercepted):
 *   Cmd+C  → copy
 *   Cmd+V  → paste
 */
export function handleDocShortcut(e: KeyboardEvent | React.KeyboardEvent): boolean {
  const meta = e.metaKey || e.ctrlKey;
  if (!meta) return false;

  const key = e.key.toLowerCase();

  // --- Formatting shortcuts (no Alt) ---
  if (!e.altKey) {
    // Cmd+B → gras
    if (key === "b") {
      e.preventDefault();
      document.execCommand("bold", false);
      return true;
    }
    // Cmd+I → italique
    if (key === "i") {
      e.preventDefault();
      document.execCommand("italic", false);
      return true;
    }
    // Cmd+U → souligné
    if (key === "u") {
      e.preventDefault();
      document.execCommand("underline", false);
      return true;
    }
    // Cmd+J → surligner en jaune
    if (key === "j") {
      e.preventDefault();
      document.execCommand("hiliteColor", false, "#eab308");
      return true;
    }
    // Cmd+T → surligner en jaune (fond du texte)
    if (key === "t") {
      e.preventDefault();
      document.execCommand("hiliteColor", false, "#eab308");
      return true;
    }
    // Cmd+A → tout sélectionner
    if (key === "a") {
      e.preventDefault();
      document.execCommand("selectAll", false);
      return true;
    }
    // Cmd+Z → annuler
    if (key === "z" && !e.shiftKey) {
      e.preventDefault();
      document.execCommand("undo", false);
      return true;
    }
    // Cmd+Shift+Z → rétablir
    if (key === "z" && e.shiftKey) {
      e.preventDefault();
      document.execCommand("redo", false);
      return true;
    }
  }

  // --- Heading shortcuts (Alt+Cmd) ---
  if (e.altKey) {
    const code = "code" in e ? (e as KeyboardEvent).code : undefined;
    if (code === "Digit1" || e.key === "&") {
      e.preventDefault();
      document.execCommand("formatBlock", false, "h1");
      return true;
    }
    if (code === "Digit2" || e.key === "é") {
      e.preventDefault();
      document.execCommand("formatBlock", false, "h2");
      return true;
    }
    if (code === "Digit3" || e.key === "\"") {
      e.preventDefault();
      document.execCommand("formatBlock", false, "h3");
      return true;
    }
  }

  return false;
}
