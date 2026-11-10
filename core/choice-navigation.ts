export function moveChoiceIndex(
  index: number,
  step: number,
  count: number,
): number {
  if (count <= 0) {
    return -1;
  }

  return (((index + step) % count) + count) % count;
}

export function choiceIndexForNumberKey(
  key: string,
  count: number,
): number | null {
  if (count <= 0 || !/^[1-9]$/.test(key)) {
    return null;
  }

  const index = Number(key) - 1;

  return index < count ? index : null;
}
