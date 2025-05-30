import type {
  PartialJSONObject,
  PartialJSONValue,
  ReadonlyPartialJSONObject,
} from './json.js';
import { isPrimitive } from './json.js';
import type {
  IExecuteResult,
  IMimeBundle,
  IOutput,
  MultilineString,
} from './protocol/index.js';
import {
  isDisplayData,
  isDisplayUpdate,
  isError,
  isExecuteResult,
  isStream,
} from './utils.js';

/**
 * Get the data from a notebook output.
 */
export function getData(output: IOutput): PartialJSONObject {
  let bundle: IMimeBundle = {};
  if (isExecuteResult(output) || isDisplayData(output) || isDisplayUpdate(output)) {
    bundle = (output as IExecuteResult).data;
  } else if (isStream(output)) {
    if (output.name === 'stderr') {
      bundle['application/vnd.jupyter.stderr'] = output.text;
    } else {
      bundle['application/vnd.jupyter.stdout'] = output.text;
    }
    if (output['display_text']) {
      if (output.name === 'stderr') {
        bundle['application/vnd.libro.large.output.stderr'] = output[
          'display_text'
        ] as MultilineString;
      } else {
        bundle['application/vnd.libro.large.output.stdout'] = output[
          'display_text'
        ] as MultilineString;
      }
    }
  } else if (isError(output)) {
    bundle['application/vnd.jupyter.error'] = output;
    const traceback = output.traceback.join('\n');
    bundle['application/vnd.jupyter.stderr'] =
      traceback || `${output.ename}: ${output.evalue}`;
  }
  return convertBundle(bundle);
}

/**
 * Get the metadata from an output message.
 */
export function getMetadata(output: IOutput): PartialJSONObject {
  const value: PartialJSONObject = Object.create(null);
  if (isExecuteResult(output) || isDisplayData(output)) {
    for (const key in output.metadata) {
      value[key] = extract(output.metadata, key);
    }
  }
  return value;
}
/**
 * Get the bundle options given output model options.
 */
export function getBundleOptions(options: IOutput) {
  const data = getData(options) as IOutput;
  const metadata = getMetadata(options);
  return { data, metadata };
}

/**
 * Extract a value from a JSONObject.
 */
export function extract(
  value: ReadonlyPartialJSONObject,
  key: string,
): PartialJSONValue | undefined {
  const item = value[key];
  if (item === undefined || isPrimitive(item)) {
    return item;
  }
  return JSON.parse(JSON.stringify(item));
}

/**
 * Convert a mime bundle to mime data.
 */
function convertBundle(bundle: IMimeBundle): PartialJSONObject {
  const map: PartialJSONObject = Object.create(null);
  for (const mimeType in bundle) {
    map[mimeType] = extract(bundle, mimeType);
  }
  return map;
}
