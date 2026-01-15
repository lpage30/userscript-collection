// Typed version of common/functions.js
import crypto from "crypto";

export const isArray = (value: unknown): value is Array<unknown> =>
  Array.isArray(value);
export const isObject = (value: unknown): value is { [key: string]: unknown } =>
  typeof value === "object" && !isArray(value) && value !== null;
export const isString = (value: unknown): value is string =>
  typeof value === "string" || value instanceof String;
export const isNumber = (value: unknown): value is number =>
  typeof value === "number" || value instanceof Number;
export const isDate = (value: unknown): value is Date => value instanceof Date;
export const isBoolean = (value: unknown): value is boolean =>
  typeof value === "boolean";

export const isNullOrUndefined = (value: any): boolean =>
  [undefined, null].includes(value);
export const isEmpty = (value: unknown): boolean => {
  return (
    [undefined, null, ""].includes(value as any) ||
    (value instanceof String && (value as String).toString().trim() == "") ||
    (isArray(value) && (value as Array<any>).length === 0) ||
    (isObject(value) &&
      !(value instanceof Date) &&
      Object.keys(value as { [key: string]: any }).length === 0)
  );
};

export const toString = (value: unknown): string => {
  if (undefined == value) {
    return "<undefined>";
  }
  if (null == value) {
    return "<null>";
  }
  if (isArray(value)) {
    return `[${(value as Array<unknown>).toString()}]`;
  }
  if (value instanceof Error) {
    return value.toString();
  }
  const result = !isEmpty((value as { [key: string]: unknown }).toString)
    ? (value as { [key: string]: any }).toString()
    : "[object Object]";
  if (isObject(value) || result == "[object Object]") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return result;
    }
  }
  return result;
};

export const toHashCode = (value: unknown): string => {
  let result = 0;
  for (const char of toString(value)) {
    result = ((result << 5) - result + char.charCodeAt(0)) << 0;
  }
  return (result + 2147483647 + 1).toString();
};

export function zeroPad(value: number | string | undefined, spaces: number) {
  if (spaces <= 0) {
    return noPad(value, spaces);
  }
  const paddingLength = spaces - (value ?? "").toString().length;
  const padding = paddingLength <= 0 ? "" : "0".repeat(paddingLength);
  return `${padding}${value ?? ""}`;
}
export function noPad(value: number | string | undefined, _spaces: number) {
  return (value ?? "").toString();
}

export function isTitleCase(text: string): boolean {
  return text
    .split(" ")
    .map((word) => word.trim())
    .filter((word) => /^[a-zA-Z]/.test(word))
    .every((word) => /^[A-Z]/.test(word));
}
export function toTitleCase(text: string): string {
  return text
    .toLowerCase()
    .split(" ")
    .map((word) => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}
export function splitByCapitals(text: string): string[] {
  if (!text) return [];

  const words: string[] = [];
  let startIndex = 0;
  for (let i = 0; i < text.length; i++) {
    if (/[A-Z]/.test(text[i])) {
      const word = text.substring(startIndex, i);
      words.push(word);
      startIndex = i;
    }
  }
  words.push(text.substring(startIndex));
  return words.map((word) => word.trim()).filter((word) => 0 < word.length);
}
export function wordsToTitleCase(
  words: string[],
  makeWordAllCaps: (word: string) => boolean = () => true,
) {
  return words.map((word) => {
    if (makeWordAllCaps(word)) return word.toUpperCase();
    return `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
  });
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export function toFilename(text: string): string {
  return text
    .trim()
    .replace(/\\|\//g, " ")
    .replace(/[^\w\s.-]+/g, " ")
    .replace(/\s+/g, "_")
    .replace(/^[_]+/g, "")
    .replace(/[_]+$/g, "");
}

export function awaitForItem<T = any>(
  getItem: () => T,
  failureMessage: string,
  options: { maxRetries: number; intervalMs: number } = {
    maxRetries: 60,
    intervalMs: 250,
  },
): Promise<T> {
  let interval: any = null;
  let tries = 0;
  const trial = (
    resolve: (value: T) => void,
    reject: (error: Error) => void,
  ): void => {
    if (tries >= options.maxRetries) {
      clearInterval(interval);
      reject(
        new Error(
          `${failureMessage} awaitForItem failed after ${tries}`.trim(),
        ),
      );
      return;
    }
    tries++;
    const item = getItem();
    if (
      (isBoolean(item) && item === true) ||
      (!isBoolean(item) && ![null, undefined].includes(item as any))
    ) {
      clearInterval(interval);
      resolve(item);
    }
  };

  return new Promise<T>((resolve, reject) => {
    tries = 0;
    interval = setInterval(() => trial(resolve, reject), options.intervalMs);
  });
}

export function getLargestOverlappingPrefix(s1: string, s2: string): string {
  const shortestString = s1.length < s2.length ? s1 : s2;
  for (let i = 0; i < shortestString.length; i++) {
    if (s1[i] !== s2[i]) {
      return s1.substring(0, i - 1);
    }
  }
  return shortestString;
}
export function getComputedStyle(e: Element): CSSStyleDeclaration {
  return window.getComputedStyle(e, null)
}
export function getAllDisplayedElements(): { e: HTMLElement, style: CSSStyleDeclaration}[] {
  return Array.from(document.querySelectorAll('*'))
    .map(e => ({
      e: e as HTMLElement,
      style: getComputedStyle(e)
    }))
    .filter(({style}) => style.display !== 'none')
}

export function toNumber(value: string | number | undefined | null): number {
  if ([null, undefined].includes(value)) return Number.NaN
  if (typeof value === 'number') return value
  const numericString = value.replace(/[^\d.-]/g, '')
  return parseFloat(numericString)
}

export const parseNumber = (value: string) => value ? parseFloat(value.replace(/[^\d\.]/g, '')) : undefined

export function normalizeName(name: string): string {
    return name.replace(/\(|\)|'|-|\s|,|\.|\&/g, '_')
}