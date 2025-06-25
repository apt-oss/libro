/* eslint-disable @typescript-eslint/unified-signatures */
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { locale } from './platform.js';
/**
 * forked from vscode l10n
 */

/**
 * @public
 * The format of a message in a bundle.
 */
export type l10nJsonMessageFormat =
  | string
  | {
      message: string;
      comment: string[];
    };

export type LangChangeEvent = (lang: L10nLang) => void;

/**
 * @public
 * The format of package.nls.json and l10n bundle files.
 */
export type l10nJsonFormat = Record<string, l10nJsonMessageFormat>;

export type LanguageBundles = Record<L10nLang, l10nJsonFormat>;

export enum L10nLang {
  zhCN = 'zh-CN',
  enUS = 'en-US',
}

function getDefaultlang() {
  let localeValue = locale;
  if (typeof navigator === 'object') {
    localeValue = localStorage?.getItem('locale') || locale;
  }
  const localeStr = localeValue.toLowerCase();
  if (localeStr === 'zh' || localeStr.startsWith('zh-')) {
    return L10nLang.zhCN;
  }
  return L10nLang.enUS;
}

export class Localization {
  static create(name: string) {
    return new Localization(name);
  }

  protected moduleName: string | undefined;

  protected bundle: l10nJsonFormat | undefined;

  protected bundles: Map<L10nLang, l10nJsonFormat> = new Map();

  protected lang = getDefaultlang();

  protected deps: Localization[] = [];

  get name() {
    return this.moduleName;
  }

  constructor(name?: string) {
    this.moduleName = name;
  }

  protected langChangeHandlers: LangChangeEvent[] = [];

  onLangChange(handler: LangChangeEvent) {
    this.langChangeHandlers.push(handler);
  }

  /**
   * 被依赖的l10n会同步主包的lang, 语言包是独立的
   * 建议模块级别的l10n作为默认l10n的依赖，这样使用默认l10n可以统一的切换语言
   * @param modules
   */
  dependOn(...modules: Localization[]) {
    this.deps.push(...modules);
    this.syncDepsLang();
  }

  /**
   *
   */
  syncDepsLang() {
    this.deps.forEach((dep) => {
      dep.changeLang(this.lang);
      dep.syncDepsLang();
    });
  }

  getLang() {
    return this.lang;
  }

  /**
   * 加载语言文件包
   * @param bundles
   */
  loadLangBundles(bundles: LanguageBundles) {
    for (const lang in bundles) {
      this.loadLang(lang as L10nLang, { contents: bundles[lang as L10nLang] });
    }
  }

  /**
   * 加载单一语言
   * @param lang
   * @param option
   */
  loadLang(lang: L10nLang, option: { contents: string | l10nJsonFormat }) {
    const bundle = this.load(option);
    if (bundle) {
      if (this.bundles.has(lang)) {
        const current = this.bundles.get(lang);
        this.bundles.set(lang, { ...current, ...bundle });
      } else {
        this.bundles.set(lang, bundle);
      }
    }

    this.changeLang(this.lang);
  }

  changeLang(lang: L10nLang) {
    localStorage.setItem('locale', lang);
    const bundle = this.bundles.get(lang);
    this.lang = lang;
    this.bundle = bundle;
    this.syncDepsLang();
    this.langChangeHandlers.forEach((handler) => handler(this.lang));
  }

  removeLang(lang: L10nLang) {
    this.bundles.delete(lang);
  }

  /**
   * Loads the bundle from the given contents. Must be run before the first call to any `l10n.t()` variant.
   * **Note** The best way to set this is to pass the value of the VS Code API `vscode.l10n.contents`
   * to the process that uses `@vscode/l10n`.
   * @param option - An object that contains one property, contents, which should contain the contents of the bundle.
   */
  protected load(option: {
    contents: string | l10nJsonFormat;
  }): l10nJsonFormat | undefined {
    let bundle: l10nJsonFormat | undefined;
    if ('contents' in option) {
      if (typeof option.contents === 'string') {
        bundle = JSON.parse(option.contents);
      } else {
        bundle = option.contents;
      }
    }
    return bundle;
  }

  /**
   * @public
   * Marks a string for localization. If the bundle has a localized value for this message, then that localized
   * value will be returned (with injected `args` values for any templated values).
   * @param message - The message to localize. Supports index templating where strings like `{0}` and `{1}` are
   * replaced by the item at that index in the `args` array.
   * @param args - The arguments to be used in the localized string. The index of the argument is used to
   * match the template placeholder in the localized string.
   * @returns localized string with injected arguments.
   * @example `l10n.localize('hello', 'Hello {0}!', 'World');`
   */
  t(message: string, ...args: L10nReplacement[]): string;
  /**
   * @public
   * Marks a string for localization. If the bundle has a localized value for this message, then that localized
   * value will be returned (with injected `args` values for any templated values).
   * @param message - The message to localize. Supports named templating where strings like `{foo}` and `{bar}` are
   * replaced by the value in the Record for that key (foo, bar, etc).
   * @param args - The arguments to be used in the localized string. The name of the key in the record is used to
   * match the template placeholder in the localized string.
   * @returns localized string with injected arguments.
   * @example `l10n.t('Hello {name}', { name: 'Erich' });`
   */
  t(message: string, args: Record<string, L10nReplacement>): string;

  /**
   * @public
   * Marks a string for localization. This function signature is made for usage
   * with tagged template literals.
   *
   * The more verbose overload should still be used if comments are required.
   * @example
   * ```
   * l10n.t`Hello ${name}!`
   * ```
   * @param message - String message components
   * @param args - Replacement components in the string
   * @returns localized string with injected arguments.
   */
  t(strs: TemplateStringsArray, ...replacements: L10nReplacement[]): string;

  /**
   * @public
   * Marks a string for localization. If the bundle has a localized value for this message, then that localized
   * value will be returned (with injected args values for any templated values).
   * @param options - The options to use when localizing the message.
   * @returns localized string with injected arguments.
   */
  t(options: {
    /**
     * The message to localize. If `args` is an array, this message supports index templating where strings like
     * `{0}` and `{1}` are replaced by the item at that index in the `args` array. If `args` is a `Record<string, any>`,
     * this supports named templating where strings like `{foo}` and `{bar}` are replaced by the value in
     * the Record for that key (foo, bar, etc).
     */
    message: string;
    /**
     * The arguments to be used in the localized string. As an array, the index of the argument is used to
     * match the template placeholder in the localized string. As a Record, the key is used to match the template
     * placeholder in the localized string.
     */
    args?: (string | number | boolean)[] | Record<string, any>;
    /**
     * A comment to help translators understand the context of the message.
     */
    comment: string | string[];
  }): string;
  t(
    ...args:
      | [str: string, ...args: (string | number | boolean)[]]
      | [message: string, args: Record<string, any>]
      | [message: TemplateStringsArray, ...args: L10nReplacement[]]
      | [
          options: {
            message: string;
            args?: (string | number | boolean)[] | Record<string, any>;
            comment?: string | string[];
          },
        ]
  ): string {
    const firstArg = args[0];
    let key: string;
    let message: string;
    let formatArgs: (string | number)[] | Record<string, any> | undefined;
    if (typeof firstArg === 'string') {
      key = firstArg;
      message = firstArg;
      args.splice(0, 1);
      formatArgs = !args || typeof args[0] !== 'object' ? args : args[0];
    } else if (firstArg instanceof Array) {
      const replacements = args.slice(1) as L10nReplacement[];
      if (firstArg.length !== replacements.length + 1) {
        throw new Error('expected a string as the first argument to l10n.t');
      }

      let str = firstArg[0]!; // implied strs.length > 0 since replacements.length >= 0
      for (let i = 1; i < firstArg.length; i++) {
        str += `{${i - 1}}` + firstArg[i];
      }

      return this.t(str, ...replacements);
    } else {
      message = firstArg.message;
      key = message;
      if (firstArg.comment && firstArg.comment.length > 0) {
        // in the format: message/commentcommentcomment
        key += `/${
          Array.isArray(firstArg.comment) ? firstArg.comment.join('') : firstArg.comment
        }`;
      }
      formatArgs = (firstArg.args as any[]) ?? {};
    }

    const messageFromBundle = this.bundle?.[key];
    if (!messageFromBundle) {
      return format(message, formatArgs as Record<string, unknown>);
    }

    if (typeof messageFromBundle === 'string') {
      return format(messageFromBundle, formatArgs as Record<string, unknown>);
    }

    if (messageFromBundle.comment) {
      return format(messageFromBundle.message, formatArgs as Record<string, unknown>);
    }
    console.info('format', message, formatArgs);
    return format(message, formatArgs as Record<string, unknown>);
  }
}

/**
 * @public
 * Type that can be used as replacements in `l10n.t()` calls.
 */
export type L10nReplacement = string | number | boolean;

const _format2Regexp = /{([^}]+)}/g;

/**
 * Helper to create a string from a template and a string record.
 * Similar to `format` but with objects instead of positional arguments.
 *
 * Copied from https://github.com/microsoft/vscode/blob/5dfca53892a1061b1c103542afe49d51f1041778/src/vs/base/common/strings.ts#L44
 */
function format(template: string, values: Record<string, unknown>): string {
  return template.replace(
    _format2Regexp,
    (match, group) => (values[group] ?? match) as string,
  );
}

/**
 * 默认的l10n
 */
export const l10n = new Localization();
