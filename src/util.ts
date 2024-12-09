export function format(text: string, code: number) {
  return `\x1b[${code}m${text}\x1b[0m` as const;
}
export function boldText(text: string) {
  return format(text, 1);
}
export function redText(text: string) {
  return format(text, 31);
}

export function sliceText(text: string, startIndex: number, endIndex: number) {
  return [
    text.slice(0, startIndex),
    text.slice(startIndex, endIndex),
    text.slice(endIndex),
  ] as const;
}
