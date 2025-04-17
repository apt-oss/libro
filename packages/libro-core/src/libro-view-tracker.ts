import { singleton, Emitter } from '@difizen/libro-common/app';
import { v4 } from 'uuid';

import type {
  ITracker,
  NotebookModel,
  NotebookView,
  Options,
} from './libro-protocol.js';

export class Tracker implements ITracker {
  [key: string]: any;
  startTime?: number;
  endTime?: number;
  extra?: any;
  id: string;

  constructor(id?: string, extra?: any) {
    this.id = id || v4();
    this.startTime = Date.now();
    this.extra = extra || {};
  }

  clearAll() {
    this.startTime = undefined;
    this.endTime = undefined;
  }

  getDuration() {
    if (this.endTime && this.startTime) {
      return this.endTime - this.startTime;
    }
    return undefined;
  }

  log() {
    const result = {
      id: this.id,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.getDuration(),
      extra: this.extra,
    };
    this.clearAll();
    return result;
  }
}

@singleton()
export class LibroViewTracker {
  viewCache: Map<string, NotebookView> = new Map();
  modelCache: Map<string, NotebookModel> = new Map();
  spmTracker: Map<string, Tracker> = new Map();
  isEnabledSpmReporter: boolean;

  protected onTrackerEmitter: Emitter<ITracker> = new Emitter();
  get onTracker() {
    return this.onTrackerEmitter.event;
  }

  getOrCreateSpmTracker(options: Options) {
    const id = options.id || v4();
    const exist = this.spmTracker.get(id);
    if (exist) {
      if (!exist.startTime) {
        exist.startTime = Date.now();
      }
      return exist;
    }
    const tracker = new Tracker(id);
    this.spmTracker.set(id, tracker);
    return tracker;
  }

  tracker(tracker: Tracker) {
    const trackerLog = tracker.log();
    this.onTrackerEmitter.fire(trackerLog);
  }

  hasTracker(id: string) {
    return this.spmTracker.has(id);
  }
}
