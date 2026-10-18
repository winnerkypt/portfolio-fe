const pad = (value: number): string => String(value).padStart(2, "0");

export function formatCaseNo(index: number, total: number): string {
  return `${pad(index + 1)} / ${pad(total)}`;
}
