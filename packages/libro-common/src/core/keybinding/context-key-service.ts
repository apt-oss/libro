import { Emitter } from '../../common/index.js';
import { inject, postConstruct, singleton } from '../../ioc/index.js';

import type { ContextKeyExpression, IContextKey } from './vs/contextkey.js';
import { ContextKeyExpr } from './vs/contextkey.js';
import { VSContextKeyService } from './vs/contextKeyService.js';

export type ContextKeyChangeEvent = {
  affects: (keys: Set<string>) => boolean;
};

@singleton()
export class ContextKeyService {
  protected readonly onDidChangeEmitter = new Emitter<ContextKeyChangeEvent>();
  readonly onDidChange = this.onDidChangeEmitter.event;
  protected fireDidChange(event: ContextKeyChangeEvent): void {
    this.onDidChangeEmitter.fire(event);
  }

  protected readonly contextKeyService: VSContextKeyService;
  protected readonly vsContextKeyService: VSContextKeyService;

  constructor(@inject(VSContextKeyService) vsContextKeyService: VSContextKeyService) {
    this.vsContextKeyService = vsContextKeyService;
    this.contextKeyService = vsContextKeyService;
  }

  @postConstruct()
  protected init(): void {
    this.contextKeyService.onDidChangeContext((e) =>
      this.fireDidChange({
        affects: (keys) => e.affectsSome(keys),
      }),
    );
  }

  createKey<T>(key: string, defaultValue: T | undefined): IContextKey<T> {
    return this.contextKeyService.createKey(key, defaultValue);
  }

  activeContext?: HTMLElement;

  match(expression: string, context?: HTMLElement): boolean {
    const ctx =
      context ||
      this.activeContext ||
      (window.document.activeElement instanceof HTMLElement
        ? window.document.activeElement
        : undefined);
    const parsed = this.parse(expression);
    if (!ctx) {
      return this.contextKeyService.contextMatchesRules(parsed);
    }
    const keyContext = this.contextKeyService.getContext(ctx);
    if (!parsed) {
      return true;
    }
    return parsed.evaluate(keyContext);
  }

  protected readonly expressions = new Map<string, ContextKeyExpression>();
  protected parse(when: string): ContextKeyExpression | undefined {
    let expression = this.expressions.get(when);
    if (!expression) {
      expression = ContextKeyExpr.deserialize(when);
      if (expression) {
        this.expressions.set(when, expression);
      }
    }
    return expression;
  }

  parseKeys(expression: string): Set<string> | undefined {
    const expr = ContextKeyExpr.deserialize(expression);
    return expr ? new Set<string>(expr.keys()) : expr;
  }
}
