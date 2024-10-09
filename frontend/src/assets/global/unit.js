const unit = [
  "L (Liter)",
  "Kg (Kilogram)",
  "g (Gram)",
  "mL (Milliliter)",
  "oz (Ounce)",
  "lbs (Pounds)",
  // "PCS (Pieces)",
  // "BOX (Box)",
];

const separatedUnits = unit.map((item) => {
  const matches = item.match(/^(.*?)\s+\(([^)]+)\)$/);
  const value = matches ? matches[1] : "";
  const label = item; // Using the whole string as the label
  return { value, label };
});

export default separatedUnits;
