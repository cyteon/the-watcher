export function getStatusColor(
  status: "up" | "down" | "pending" | "paused",
): string {
  switch (status) {
    case "up":
      return "green-400";
    case "down":
      return "red-400";
    case "pending":
      return "yellow-300";
    case "paused":
      return "neutral-600";
    default:
      return "white";
  }
}
