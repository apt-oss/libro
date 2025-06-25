/* eslint-disable no-control-regex */
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CharCode } from './charCode.js';

export function isFalsyOrWhitespace(str: string | undefined): boolean {
  if (!str || typeof str !== 'string') {
    return true;
  }
  return str.trim().length === 0;
}

const _formatRegexp = /{(\d+)}/g;

/**
 * Helper to produce a string with a variable number of arguments. Insert variable segments
 * into the string using the {n} notation where N is the index of the argument following the string.
 * @param value string to which formatting is applied
 * @param args replacements for {n}-entries
 */
export function format(value: string, ...args: any[]): string {
  if (args.length === 0) {
    return value;
  }
  return value.replace(_formatRegexp, function (match, group) {
    const idx = parseInt(group, 10);
    // eslint-disable-next-line no-restricted-globals
    return isNaN(idx) || idx < 0 || idx >= args.length ? match : args[idx];
  });
}

/**
 * Converts HTML characters inside the string to use entities instead. Makes the string safe from
 * being used e.g. in HTMLElement.innerHTML.
 */
export function escape(html: string): string {
  return html.replace(/[<>&]/g, function (match) {
    switch (match) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      default:
        return match;
    }
  });
}

/**
 * Escapes regular expression characters in a given string
 */
export function escapeRegExpCharacters(value: string): string {
  // eslint-disable-next-line no-useless-escape
  return value.replace(/[\\\{\}\*\+\?\|\^\$\.\[\]\(\)]/g, '\\$&');
}

/**
 * Counts how often `character` occurs inside `value`.
 */
export function count(value: string, character: string): number {
  let result = 0;
  const ch = character.charCodeAt(0);
  for (let i = value.length - 1; i >= 0; i--) {
    if (value.charCodeAt(i) === ch) {
      result++;
    }
  }
  return result;
}

export function truncate(value: string, maxLength: number, suffix = '…'): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.substr(0, maxLength)}${suffix}`;
}

/**
 * Removes all occurrences of needle from the beginning and end of haystack.
 * @param haystack string to trim
 * @param needle the thing to trim (default is a blank)
 */
export function trim(haystack: string, needle = ' '): string {
  const trimmed = ltrim(haystack, needle);
  return rtrim(trimmed, needle);
}

/**
 * Removes all occurrences of needle from the beginning of haystack.
 * @param haystack string to trim
 * @param needle the thing to trim
 */
export function ltrim(haystack: string, needle: string): string {
  if (!haystack || !needle) {
    return haystack;
  }

  const needleLen = needle.length;
  if (needleLen === 0 || haystack.length === 0) {
    return haystack;
  }

  let offset = 0;

  while (haystack.indexOf(needle, offset) === offset) {
    offset += needleLen;
  }
  return haystack.substring(offset);
}

/**
 * Removes all occurrences of needle from the end of haystack.
 * @param haystack string to trim
 * @param needle the thing to trim
 */
export function rtrim(haystack: string, needle: string): string {
  if (!haystack || !needle) {
    return haystack;
  }

  const needleLen = needle.length;
  const haystackLen = haystack.length;

  if (needleLen === 0 || haystackLen === 0) {
    return haystack;
  }

  let offset = haystackLen;
  let idx = -1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    idx = haystack.lastIndexOf(needle, offset - 1);
    if (idx === -1 || idx + needleLen !== offset) {
      break;
    }
    if (idx === 0) {
      return '';
    }
    offset = idx;
  }

  return haystack.substring(0, offset);
}

export function convertSimple2RegExpPattern(pattern: string): string {
  // eslint-disable-next-line no-useless-escape
  return (
    pattern
      // eslint-disable-next-line no-useless-escape
      .replace(/[\-\\\{\}\+\?\|\^\$\.\,\[\]\(\)\#\s]/g, '\\$&')
      // eslint-disable-next-line no-useless-escape
      .replace(/[\*]/g, '.*')
  );
}

export function stripWildcards(pattern: string): string {
  return pattern.replace(/\*/g, '');
}

export interface RegExpOptions {
  matchCase?: boolean;
  wholeWord?: boolean;
  multiline?: boolean;
  global?: boolean;
  unicode?: boolean;
}

export function createRegExp(
  searchString: string,
  isRegex: boolean,
  options: RegExpOptions = {},
): RegExp {
  if (!searchString) {
    throw new Error('Cannot create regex from empty string');
  }
  if (!isRegex) {
    searchString = escapeRegExpCharacters(searchString);
  }
  if (options.wholeWord) {
    if (!/\B/.test(searchString.charAt(0))) {
      searchString = `\\b${searchString}`;
    }
    if (!/\B/.test(searchString.charAt(searchString.length - 1))) {
      searchString += '\\b';
    }
  }
  let modifiers = '';
  if (options.global) {
    modifiers += 'g';
  }
  if (!options.matchCase) {
    modifiers += 'i';
  }
  if (options.multiline) {
    modifiers += 'm';
  }
  if (options.unicode) {
    modifiers += 'u';
  }

  return new RegExp(searchString, modifiers);
}

export function regExpLeadsToEndlessLoop(regexp: RegExp): boolean {
  // Exit early if it's one of these special cases which are meant to match
  // against an empty string
  if (
    regexp.source === '^' ||
    regexp.source === '^$' ||
    regexp.source === '$' ||
    regexp.source === '^\\s*$'
  ) {
    return false;
  }

  // We check against an empty string. If the regular expression doesn't advance
  // (e.g. ends in an endless loop) it will match an empty string.
  const match = regexp.exec('');
  return !!(match && regexp.lastIndex === 0);
}

export function regExpContainsBackreference(regexpValue: string): boolean {
  return !!regexpValue.match(/([^\\]|^)(\\\\)*\\\d+/);
}

export function regExpFlags(regexp: RegExp): string {
  return (
    (regexp.global ? 'g' : '') +
    (regexp.ignoreCase ? 'i' : '') +
    (regexp.multiline ? 'm' : '') +
    ((regexp as any) /* standalone editor compilation */.unicode ? 'u' : '')
  );
}

export function splitLines(str: string): string[] {
  return str.split(/\r\n|\r|\n/);
}

/**
 * Returns first index of the string that is not whitespace.
 * If string is empty or contains only whitespaces, returns -1
 */
export function firstNonWhitespaceIndex(str: string): number {
  for (let i = 0, len = str.length; i < len; i++) {
    const chCode = str.charCodeAt(i);
    if (chCode !== CharCode.Space && chCode !== CharCode.Tab) {
      return i;
    }
  }
  return -1;
}

/**
 * Returns the leading whitespace of the string.
 * If the string contains only whitespaces, returns entire string
 */
export function getLeadingWhitespace(
  str: string,
  start = 0,
  end: number = str.length,
): string {
  for (let i = start; i < end; i++) {
    const chCode = str.charCodeAt(i);
    if (chCode !== CharCode.Space && chCode !== CharCode.Tab) {
      return str.substring(start, i);
    }
  }
  return str.substring(start, end);
}

/**
 * Returns last index of the string that is not whitespace.
 * If string is empty or contains only whitespaces, returns -1
 */
export function lastNonWhitespaceIndex(
  str: string,
  startIndex: number = str.length - 1,
): number {
  for (let i = startIndex; i >= 0; i--) {
    const chCode = str.charCodeAt(i);
    if (chCode !== CharCode.Space && chCode !== CharCode.Tab) {
      return i;
    }
  }
  return -1;
}

export function compare(a: string, b: string): number {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
}

export function compareSubstring(
  a: string,
  b: string,
  aStart = 0,
  aEnd: number = a.length,
  bStart = 0,
  bEnd: number = b.length,
): number {
  for (; aStart < aEnd && bStart < bEnd; aStart++, bStart++) {
    const codeA = a.charCodeAt(aStart);
    const codeB = b.charCodeAt(bStart);
    if (codeA < codeB) {
      return -1;
    }
    if (codeA > codeB) {
      return 1;
    }
  }
  const aLen = aEnd - aStart;
  const bLen = bEnd - bStart;
  if (aLen < bLen) {
    return -1;
  }
  if (aLen > bLen) {
    return 1;
  }
  return 0;
}

export function compareIgnoreCase(a: string, b: string): number {
  return compareSubstringIgnoreCase(a, b, 0, a.length, 0, b.length);
}

export function compareSubstringIgnoreCase(
  a: string,
  b: string,
  aStart = 0,
  aEnd: number = a.length,
  bStart = 0,
  bEnd: number = b.length,
): number {
  for (; aStart < aEnd && bStart < bEnd; aStart++, bStart++) {
    const codeA = a.charCodeAt(aStart);
    const codeB = b.charCodeAt(bStart);

    if (codeA === codeB) {
      // equal
      continue;
    }

    const diff = codeA - codeB;
    if (diff === 32 && isUpperAsciiLetter(codeB)) {
      //codeB =[65-90] && codeA =[97-122]
      continue;
    } else if (diff === -32 && isUpperAsciiLetter(codeA)) {
      //codeB =[97-122] && codeA =[65-90]
      continue;
    }

    if (isLowerAsciiLetter(codeA) && isLowerAsciiLetter(codeB)) {
      //
      return diff;
    }
    return compareSubstring(
      a.toLowerCase(),
      b.toLowerCase(),
      aStart,
      aEnd,
      bStart,
      bEnd,
    );
  }

  const aLen = aEnd - aStart;
  const bLen = bEnd - bStart;

  if (aLen < bLen) {
    return -1;
  }
  if (aLen > bLen) {
    return 1;
  }

  return 0;
}

export function isLowerAsciiLetter(code: number): boolean {
  return code >= CharCode.a && code <= CharCode.z;
}

export function isUpperAsciiLetter(code: number): boolean {
  return code >= CharCode.A && code <= CharCode.Z;
}

function isAsciiLetter(code: number): boolean {
  return isLowerAsciiLetter(code) || isUpperAsciiLetter(code);
}

export function equalsIgnoreCase(a: string, b: string): boolean {
  return a.length === b.length && doEqualsIgnoreCase(a, b);
}

function doEqualsIgnoreCase(a: string, b: string, stopAt = a.length): boolean {
  for (let i = 0; i < stopAt; i++) {
    const codeA = a.charCodeAt(i);
    const codeB = b.charCodeAt(i);

    if (codeA === codeB) {
      continue;
    }

    // a-z A-Z
    if (isAsciiLetter(codeA) && isAsciiLetter(codeB)) {
      const diff = Math.abs(codeA - codeB);
      if (diff !== 0 && diff !== 32) {
        return false;
      }
    }

    // Any other charcode
    else if (
      String.fromCharCode(codeA).toLowerCase() !==
      String.fromCharCode(codeB).toLowerCase()
    ) {
      return false;
    }
  }

  return true;
}

export function startsWithIgnoreCase(str: string, candidate: string): boolean {
  const candidateLength = candidate.length;
  if (candidate.length > str.length) {
    return false;
  }

  return doEqualsIgnoreCase(str, candidate, candidateLength);
}

/**
 * @returns the length of the common prefix of the two strings.
 */
export function commonPrefixLength(a: string, b: string): number {
  let i: number;
  const len = Math.min(a.length, b.length);

  for (i = 0; i < len; i++) {
    if (a.charCodeAt(i) !== b.charCodeAt(i)) {
      return i;
    }
  }

  return len;
}

/**
 * @returns the length of the common suffix of the two strings.
 */
export function commonSuffixLength(a: string, b: string): number {
  let i: number;
  const len = Math.min(a.length, b.length);

  const aLastIndex = a.length - 1;
  const bLastIndex = b.length - 1;

  for (i = 0; i < len; i++) {
    if (a.charCodeAt(aLastIndex - i) !== b.charCodeAt(bLastIndex - i)) {
      return i;
    }
  }

  return len;
}

/**
 * See http://en.wikipedia.org/wiki/Surrogate_pair
 */
export function isHighSurrogate(charCode: number): boolean {
  return charCode >= 0xd800 && charCode <= 0xdbff;
}

/**
 * See http://en.wikipedia.org/wiki/Surrogate_pair
 */
export function isLowSurrogate(charCode: number): boolean {
  return charCode >= 0xdc00 && charCode <= 0xdfff;
}

/**
 * See http://en.wikipedia.org/wiki/Surrogate_pair
 */
export function computeCodePoint(highSurrogate: number, lowSurrogate: number): number {
  return ((highSurrogate - 0xd800) << 10) + (lowSurrogate - 0xdc00) + 0x10000;
}

/**
 * get the code point that begins at offset `offset`
 */
export function getNextCodePoint(str: string, len: number, offset: number): number {
  const charCode = str.charCodeAt(offset);
  if (isHighSurrogate(charCode) && offset + 1 < len) {
    const nextCharCode = str.charCodeAt(offset + 1);
    if (isLowSurrogate(nextCharCode)) {
      return computeCodePoint(charCode, nextCharCode);
    }
  }
  return charCode;
}
