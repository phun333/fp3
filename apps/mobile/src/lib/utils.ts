export function initialsFromName(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function formatDate(value?: string | Date | null): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function statusLabel(status: string): string {
  switch (status) {
    case "OPEN":
      return "Açık";
    case "IN_PROGRESS":
      return "Devam Ediyor";
    case "CLOSED":
      return "Kapalı";
    case "PENDING":
      return "Beklemede";
    case "ACCEPTED":
      return "Kabul Edildi";
    case "REJECTED":
      return "Reddedildi";
    default:
      return status;
  }
}
