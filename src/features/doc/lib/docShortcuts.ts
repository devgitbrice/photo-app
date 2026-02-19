/**
 * Handle doc editor keyboard shortcuts.
 * Returns true if the event was handled (should preventDefault).
 *
 * Shortcuts:
 *   Cmd+B  → bold        (native contentEditable)
 *   Cmd+I  → italic      (native contentEditable)
 *   Cmd+U  → underline   (native contentEditable)
 *   Cmd+J  → highlight yellow
 *   Alt+Cmd+& / Alt+Cmd+1 → H1
 *   Alt+Cmd+é / Alt+Cmd+2 → H2
 *   Alt+Cmd+" / Alt+Cmd+3 → H3
 */
export function handleDocShortcut(e: KeyboardEvent | React.KeyboardEvent): boolean {
  const meta = e.metaKey || e.ctrlKey;
  if (!meta) return false;

  // Cmd+J → surligner en jaune
  if (!e.altKey && (e.key === "j" || e.key === "J")) {
    e.preventDefault();
    document.execCommand("hiliteColor", false, "#eab308");
    return true;
  }

  // Alt+Cmd + digit → headings (works on any keyboard layout via e.code)
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
