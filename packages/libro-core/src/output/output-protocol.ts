import type {
  IOutput,
  ReadonlyPartialJSONObject,
  JSONObject,
} from '@difizen/libro-common';
import type { Emitter, Event } from '@difizen/libro-common/app';
import type { View } from '@difizen/libro-common/app';
import { Syringe } from '@difizen/libro-common/app';

import type { CellView } from '../libro-protocol.js';

export const CellOption = Symbol('CellOption');

export interface IOutputAreaOption {
  cellId: string;
  outputAreaId?: string;
  cell: CellView;
}

export interface BaseOutputArea extends View {
  /**
   * The length of the items in the model.
   */
  readonly length: number;

  /**
   * Whether the output area is trusted.
   */
  // trusted: boolean;

  /**
   * Get an item at the specified index.
   */
  get: (index: number) => BaseOutputModel;

  /**
   * Add an output, which may be combined with previous output.
   *
   * @returns The total number of outputs.
   *
   * #### Notes
   * The output bundle is copied.
   * Contiguous stream outputs of the same `name` are combined.
   */
  add: (output: IOutput) => Promise<number>;

  /**
   * Set the value at the specified index.
   */
  set: (index: number, output: IOutput) => Promise<void>;

  /**
   * Clear all of the output.
   *
   * @param wait - Delay clearing the output until the next message is added.
   */
  clear: (wait?: boolean) => void;

  /**
   * Deserialize the model from JSON.
   *
   * #### Notes
   * This will clear any existing data.
   */
  fromJSON: (values: IOutput[]) => Promise<void>;

  /**
   * Serialize the model to JSON.
   */
  toJSON: () => IOutput[];

  outputs: BaseOutputModel[];

  cell: CellView;

  setupCellView: (cell: CellView) => void;

  get onUpdate(): Event<void>;
}

/**
 * The interface for an output model.
 */
export interface BaseOutputView extends View {
  id: string;

  raw: IOutput;

  cell: CellView;

  /**
   * The output type.
   */
  readonly type: string;

  /**
   * Whether the output is trusted.
   */
  trusted: boolean;
  /**
   * The data associated with the model.
   */
  data: JSONObject;

  onUpdateEmitter: Emitter<void>;

  onUpdate: Event<void>;

  isTabRender?: boolean;

  /**
   * The metadata associated with the model.
   *
   * Among others, it can include an attribute named `fragment`
   * that stores a URI fragment identifier for the MIME resource.
   */
  readonly metadata: ReadonlyPartialJSONObject;
  /**
   * Dispose of the resources used by the output model.
   */
  dispose: () => void;

  /**
   * Serialize the model to JSON.
   */
  toJSON: () => IOutput;

  /**
   * Set the data associated with the model.
   *
   * #### Notes
   * Depending on the implementation of the mime model,
   */
  setData(options: ISetDataOptions): void;

  /**
   * undefined is considered allowed
   */
  allowClear?: boolean;
}

/**
 * @deprecated use BaseOutputView instead
 */
export type BaseOutputModel = BaseOutputView;

/**
 * The options used to update a output model.
 */
export interface ISetDataOptions {
  /**
   * The new data object.
   */
  data?: JSONObject;

  /**
   * The new metadata object.
   */
  metadata?: JSONObject;
}

export interface IOutputOptions {
  output: IOutput;
  trusted: boolean;
  cell: CellView;
}

export type OutputModelFactory = (options: IOutputOptions) => Promise<BaseOutputModel>;

export const OutputContribution = Syringe.defineToken('OutputContribution');
export interface OutputContribution {
  canHandle: (output: IOutput) => number;
  factory: OutputModelFactory;
}
