import type { Disposable } from '../../../common/index.js';
import { singleton } from '../../../ioc/index.js';
import { BaseVariableRegistry } from '../base-variable-registry.js';
import type { VariableDefinition } from '../protocol.js';

import * as VSColor from './color.js';

/**
 * Either be a reference to an existing color or a color value as a hex string, rgba, or hsla.
 */
export type Color = string | RGBA | HSLA | ColorTransformation;
export namespace Color {
  export function rgba(r: number, g: number, b: number, a = 1): Color {
    return { r, g, b, a };
  }
  export function hsla(h: number, s: number, l: number, a = 1): Color {
    return { h, s, l, a };
  }
  export const white = rgba(255, 255, 255, 1);
  export const black = rgba(0, 0, 0, 1);
  export function transparent(v: string, f: number): ColorTransformation {
    return { v, f, kind: 'transparent' };
  }
  export function lighten(v: string, f: number): ColorTransformation {
    return { v, f, kind: 'lighten' };
  }
  export function darken(v: string, f: number): ColorTransformation {
    return { v, f, kind: 'darken' };
  }
}
export type ColorTransformation = {
  kind: 'transparent' | 'lighten' | 'darken';
  v: string;
  f: number;
};
export type RGBA = {
  /**
   * Red: integer in [0-255]
   */
  readonly r: number;

  /**
   * Green: integer in [0-255]
   */
  readonly g: number;

  /**
   * Blue: integer in [0-255]
   */
  readonly b: number;

  /**
   * Alpha: float in [0-1]
   */
  readonly a: number;
};
export type HSLA = {
  /**
   * Hue: integer in [0, 360]
   */
  readonly h: number;
  /**
   * Saturation: float in [0, 1]
   */
  readonly s: number;
  /**
   * Luminosity: float in [0, 1]
   */
  readonly l: number;
  /**
   * Alpha: float in [0, 1]
   */
  readonly a: number;
};

/**
 * It should be implemented by an extension, e.g. by the monaco extension.
 */
@singleton()
export class ColorRegistry extends BaseVariableRegistry {
  protected override get definitionList(): VariableDefinition<Color>[] {
    return [...this.definitionMap.values()];
  }
  protected override definitionMap: Map<string, VariableDefinition<Color>> = new Map();

  override register(...definitions: VariableDefinition<Color>[]): Disposable {
    return super.register(...definitions);
  }

  protected override doRegister(definition: VariableDefinition<Color>): Disposable {
    return super.doRegister(definition);
  }

  getColors() {
    return this.getDefinitionIds();
  }

  getCurrentColor(id: string) {
    return this.getCurrentDefinitionValue(id);
  }

  override getCurrentDefinitionValue(id: string): string | undefined {
    const theme = this.themeService.getActiveTheme();
    const { type, extraTokens } = theme;
    if (extraTokens && extraTokens.color && extraTokens.color[id]) {
      return this.toColor(extraTokens.color[id])?.toString();
    }
    const definition = this.definitionMap.get(id);
    if (definition && definition.defaults && definition.defaults[type]) {
      return this.toColor(definition.defaults[type])?.toString();
    }
    return undefined;
  }

  protected toColor(value: Color | undefined): string | VSColor.Color | undefined {
    if (!value) {
      return undefined;
    }
    if (typeof value === 'string') {
      if (value[0] === '#') {
        return VSColor.Color.fromHex(value);
      }
      return this.toColor(this.getCurrentDefinitionValue(value));
    }
    if ('kind' in value) {
      const colorValue = this.getCurrentDefinitionValue(value.v);
      if (colorValue) {
        const color = VSColor.Color.fromHex(colorValue);
        return color[value.kind](value.f);
      }
      return undefined;
    }
    if ('r' in value) {
      const { r, g, b, a } = value;
      return new VSColor.Color(new VSColor.RGBA(r, g, b, a));
    }
    const { h, s, l, a } = value;
    return new VSColor.Color(new VSColor.HSLA(h, s, l, a));
  }
}
