const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatCurrency(value: string | number | undefined): string {
  if (!value) return "—";

  const stringValue = value.toString();

  // If it's already formatted with $ and commas, return as-is
  if (stringValue.includes("$")) {
    return stringValue;
  }

  // Check if it's a range (contains dash or "to")
  if (stringValue.includes("-") || stringValue.toLowerCase().includes("to")) {
    const parts = stringValue.split(/[-–—]|to/i).map((p) => p.trim());
    if (parts.length === 2) {
      const low = parseFloat(parts[0].replace(/[^0-9.]/g, ""));
      const high = parseFloat(parts[1].replace(/[^0-9.]/g, ""));

      if (!isNaN(low) && !isNaN(high)) {
        return `${currencyFormatter.format(low)} - ${currencyFormatter.format(
          high
        )}`;
      }
    }
  }

  // Try to parse as a single number
  const numValue = parseFloat(stringValue.replace(/[^0-9.]/g, ""));
  if (!isNaN(numValue)) {
    return currencyFormatter.format(numValue);
  }

  // Return as-is if we can't parse it
  return stringValue;
}
