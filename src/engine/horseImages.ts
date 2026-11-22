export function getHorseImageUrl(coatColor?: string): string {
  const key = (coatColor || 'white').toLowerCase().replace(/\s+/g, '_');
  const validCoats = ['black', 'brown', 'chestnut', 'creamy', 'dark_brown', 'gray', 'white'];
  if (validCoats.includes(key)) {
    return `./horses/${key}.png`;
  }
  return './horses/white.png';
}
