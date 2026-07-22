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
  const grouped: { [cycle: string]: T[] } = {};
  for (const app of apps) {
    const cycle: string | undefined = app.applicationCycle;
    if (!cycle) continue;
    if (!grouped[cycle]) grouped[cycle] = [];
    grouped[cycle].push(app);
  }
  return grouped;
};
