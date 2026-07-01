export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function formatNumber(num: number): string {
  return num.toLocaleString();
}
