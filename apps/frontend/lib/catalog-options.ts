/** Product attribute choices — shared by the admin form (client) and validation (server). */

export const SIZE_OPTIONS: { value: string; label: string }[] = [
  { value: "free", label: "Free Size" },
  { value: "xs", label: "XS" },
  { value: "s", label: "S" },
  { value: "m", label: "M" },
  { value: "l", label: "L" },
  { value: "xl", label: "XL" },
  { value: "xxl", label: "XXL" },
  { value: "52", label: "52" },
  { value: "54", label: "54" },
  { value: "56", label: "56" },
  { value: "58", label: "58" },
];

export const MATERIAL_OPTIONS = [
  "Georgette", "Chiffon", "Crinkle", "Silk", "Lawn", "Cotton",
  "Polyester", "Cashmere", "Nida", "Jersey", "Linen",
];

export const OCCASION_OPTIONS: { value: string; label: string }[] = [
  { value: "casual", label: "Casual" },
  { value: "office", label: "Office" },
  { value: "formal", label: "Formal" },
  { value: "party", label: "Party" },
  { value: "bridal", label: "Bridal" },
  { value: "everyday", label: "Everyday" },
];
