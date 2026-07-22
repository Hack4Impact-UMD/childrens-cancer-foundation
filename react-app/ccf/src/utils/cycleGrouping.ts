// Shared helpers for grouping/sorting submitted applications by application
// cycle. Used by both the admin and reviewer "database" pages so they present
// the same cycle set in the same order.

// Cycle names are free text ("2022", "New-Cycle3"), so a Number() sort is
// undefined for non-numeric names. Numeric-aware descending string compare.
export const compareCycleNamesDesc = (a: string, b: string): number =>
  b.localeCompare(a, undefined, { numeric: true, sensitivity: "base" });

// Group applications by their `applicationCycle` name. Applications without a
// cycle are skipped (they cannot be placed in a section).
export const groupApplicationsByCycle = <T extends Record<string, any>>(
  apps: T[]
): { [cycle: string]: T[] } => {
  // Prototype-free accumulator: cycle names are admin-set free text, so a name
  // like "__proto__" or "constructor" must be treated as an ordinary key rather
  // than hitting Object.prototype (which would skip init and throw on .push).
  const grouped: { [cycle: string]: T[] } = Object.create(null);
  for (const app of apps) {
    const cycle: string | undefined = app.applicationCycle;
    if (!cycle) continue;
    if (!grouped[cycle]) grouped[cycle] = [];
    grouped[cycle].push(app);
  }
  return grouped;
};
