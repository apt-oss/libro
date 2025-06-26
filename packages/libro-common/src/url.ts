import pkg from 'path-browserify';
import urlparse from 'url-parse';

import { isWeb } from './app/index.js';

const { posix } = pkg;

/**
 * The namespace for URL-related functions.
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export class URL {
  /**
   * Parse URL and retrieve hostname
   *
   * @param url - The URL string to parse
   *
   * @returns a hostname string value
   */
  static getHostName(url: string): string {
    return urlparse(url).hostname;
  }
  /**
   * Normalize a url.
   */
  static normalize(url: string): string;
  static normalize(url: undefined): undefined;
  static normalize(url: string | undefined): string | undefined;
  static normalize(url: string | undefined): string | undefined {
    if (!url) {
      return undefined;
    }
    if (isWeb) {
      const a = document.createElement('a');
      a.href = url;
      return a.toString();
    }
    return urlparse(url).toString();
  }

  /**
   * Join a sequence of url components and normalizes as in node `path.join`.
   *
   * @param parts - The url components.
   *
   * @returns the joined url.
   */
  static join(...parts: string[]): string {
    let u = urlparse(parts[0], {});
    // Schema-less URL can be only parsed as relative to a base URL
    // see https://github.com/unshiftio/url-parse/issues/219#issuecomment-1002219326
    const isSchemaLess = u.protocol === '' && u.slashes;
    if (isSchemaLess) {
      u = urlparse(parts[0], 'https:' + parts[0]);
    }
    const prefix = `${isSchemaLess ? '' : u.protocol}${u.slashes ? '//' : ''}${u.auth}${
      u.auth ? '@' : ''
    }${u.host}`;
    // If there was a prefix, then the first path must start at the root.
    const path = posix.join(
      `${!!prefix && u.pathname[0] !== '/' ? '/' : ''}${u.pathname}`,
      ...parts.slice(1),
    );
    return `${prefix}${path === '.' ? '' : path}`;
  }

  /**
   * Encode the components of a multi-segment url.
   *
   * @param url - The url to encode.
   *
   * @returns the encoded url.
   *
   * #### Notes
   * Preserves the `'/'` separators.
   * Should not include the base url, since all parts are escaped.
   */
  static encodeParts(url: string): string {
    return URL.join(...url.split('/').map(encodeURIComponent));
  }
  /**
   * Parse a url into a URL object.
   *
   * @param urlString - The URL string to parse.
   *
   * @returns A URL object.
   */
  static parse(url: string): IUrl {
    if (typeof document !== 'undefined' && document) {
      const a = document.createElement('a');
      a.href = url;
      return a;
    }
    return urlparse(url);
  }
  /**
   * Test whether the url is a local url.
   *
   * #### Notes
   * This function returns `false` for any fully qualified url, including
   * `data:`, `file:`, and `//` protocol URLs.
   */
  static isLocal(url: string): boolean {
    const { protocol } = URL.parse(url);

    return (
      (!protocol || url.toLowerCase().indexOf(protocol) !== 0) && url.indexOf('/') !== 0
    );
  }
}

/**
 * The interface for a URL object
 */
export interface IUrl {
  /**
   * The full URL string that was parsed with both the protocol and host
   * components converted to lower-case.
   */
  href: string;

  /**
   * Identifies the URL's lower-cased protocol scheme.
   */
  protocol: string;

  /**
   * The full lower-cased host portion of the URL, including the port if
   * specified.
   */
  host: string;

  /**
   * The lower-cased host name portion of the host component without the
   * port included.
   */
  hostname: string;

  /**
   * The numeric port portion of the host component.
   */
  port: string;

  /**
   * The entire path section of the URL.
   */
  pathname: string;

  /**
   * The "fragment" portion of the URL including the leading ASCII hash
   * `(#)` character
   */
  hash: string;

  /**
   * The search element, including leading question mark (`'?'`), if any,
   * of the URL.
   */
  search?: string;
}
