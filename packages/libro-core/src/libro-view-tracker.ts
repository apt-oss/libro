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

export class FpsTracker implements ITracker {
  [key: string]: any;
  extra?: any;
  id: string;
  avgFPS: number;
  maxFrameTime: number;
  totalDropped: number;

  constructor(id?: string, extra?: any) {
    this.id = id || v4();
    this.extra = extra || {};
  }

  log() {
    const result = {
      id: this.id,
      avgFPS: this.avgFPS,
      maxFrameTime: this.maxFrameTime,
      totalDropped: this.totalDropped,
      extra: this.extra,
    };
    return result;
  }
}

@singleton()
export class LibroViewTracker {
  viewCache: Map<string, NotebookView> = new Map();
  modelCache: Map<string, NotebookModel> = new Map();
  trackers: Map<string, ITracker> = new Map();
  isEnabledSpmReporter: boolean;

  protected onTrackerEmitter: Emitter<Record<string, any>> = new Emitter();
  get onTracker() {
    return this.onTrackerEmitter.event;
  }

  getOrCreateTrackers(options: Options) {
    const id = options.id || v4();
    const exist = this.trackers.get(id);
    if (exist) {
      if (options['type'] !== 'fps' && !exist['startTime']) {
        exist['startTime'] = Date.now();
      }
      return exist;
    }

    const tracker = options['type'] === 'fps' ? new FpsTracker(id) : new Tracker(id);
    this.trackers.set(id, tracker);
    return tracker;
  }

  tracker(tracker: ITracker) {
    const trackerLog = tracker.log();
    this.trackers.delete(tracker.id);
    this.onTrackerEmitter.fire(trackerLog);
  }

  hasTracker(id: string) {
    return this.trackers.has(id);
  }
}
