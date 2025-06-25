import { Syringe } from '../../../ioc/index.js';
import type { VariableDefinition } from '../protocol.js';

import type { ColorRegistry } from './color-registry.js';
import type { Color } from './color.js';

export const ColorContribution = Syringe.defineToken('ColorContribution');
export type ColorContribution = {
  registerColors: (colors: ColorRegistry) => void;
};

export type ColorDefinition = VariableDefinition<Color>;
