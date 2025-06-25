import type { Event } from '../../common/index.js';
import { isOSX } from '../../common/index.js';
import { Emitter, Disposable, DisposableCollection } from '../../common/index.js';
import { contrib, inject, singleton, Syringe } from '../../ioc/index.js';
import type { Contribution } from '../../ioc/index.js';
import type { Application } from '../application/index.js';
import { ApplicationContribution } from '../application/index.js';
import { CommandRegistry, Command } from '../command/index.js';
import { DebugService } from '../common/debug.js';
import { KeyboardLayoutService } from '../keyboard/keyboard-layout-service.js';
import { KeyCode, KeySequence, Key } from '../keyboard/keys.js';

import { ContextKeyService } from './context-key-service.js';
import { KeybindingContribution } from './keybinding-proocol.js';

/**
 * A Keybinding binds a specific key sequence ({@link Keybinding#keybinding}) to trigger a command ({@link Keybinding#command}). A Keybinding optionally may
 * define a "when clause" ({@link Keybinding#when}) to specify in which context it becomes active.
 * @see KeyBindingRegistry
 */
export type Keybinding = {
  /**
   * Unique command identifier of the command to be triggered by this keybinding.
   */
  command: string;
  /**
   * The key sequence for the keybinding as defined in packages/keymaps/README.md.
   */
  keybinding: string;
  /**
   * The optional keybinding context where this binding belongs to.
   * If not specified, then this keybinding context belongs to the NOOP
   * keybinding context.
   *
   * @deprecated use `when` closure instead
   */
  context?: string | undefined;
  /**
   * An optional clause defining the condition when the keybinding is active, e.g. based on the current focus.
   * See {@link https://code.visualstudio.com/docs/getstarted/keybindings#_when-clause-contexts} for more details.
   */
  when?: string | undefined;

  /**
   * Optional arguments that will be passed to the command when it gets triggered via this keybinding.
   * Needs to be specified when the triggered command expects arguments to be passed to the command handler.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args?: any;

  preventDefault?: boolean;
  stopPropagation?: boolean;
};
export namespace Keybinding {
  /**
   * Compares two keybindings for equality.
   * Can optionally ignore the keybinding and/or args property in the comparison.
   * @param a The first Keybinding in the comparison
   * @param b The second Keybinding in the comparison
   * @param ignoreKeybinding Ignore the 'keybinding' property in the comparison
   * @param ignoreArgs Ignore the 'args' property in the comparison
   */
  export function equals(
    a: Keybinding,
    b: Keybinding,
    ignoreKeybinding = false,
    ignoreArgs = false,
  ): boolean {
    if (
      a.command === b.command &&
      (a.context || '') === (b.context || '') &&
      (a.when || '') === (b.when || '') &&
      (ignoreKeybinding || a.keybinding === b.keybinding) &&
      (ignoreArgs || (a.args || '') === (b.args || ''))
    ) {
      return true;
    }
    return false;
  }

  /**
   * Returns a new object only containing properties which
   * are described on the `Keybinding` API.
   *
   * @param binding the binding to create an API object for.
   */
  export function apiObjectify(binding: Keybinding): Keybinding {
    return {
      command: binding.command,
      keybinding: binding.keybinding,
      context: binding.context,
      when: binding.when,
      args: binding.args,
    };
  }

  /**
   * Returns with the string representation of the binding.
   * Any additional properties which are not described on
   * the `Keybinding` API will be ignored.
   *
   * @param binding the binding to stringify.
   */
  export function stringify(binding: Keybinding): string {
    return JSON.stringify(apiObjectify(binding));
  }

  /* Determine whether object is a KeyBinding */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function is(arg: Keybinding | any): arg is Keybinding {
    return !!arg && arg === Object(arg) && 'command' in arg && 'keybinding' in arg;
  }
}

export enum KeybindingScope {
  DEFAULT,
  USER,
  WORKSPACE,
  END,
}
export namespace KeybindingScope {
  export const length = KeybindingScope.END - KeybindingScope.DEFAULT;
}

export type ResolvedKeybinding = {
  /**
   * The KeyboardLayoutService may transform the `keybinding` depending on the
   * user's keyboard layout. This property holds the transformed keybinding that
   * should be used in the UI. The value is undefined if the KeyboardLayoutService
   * has not been called yet to resolve the keybinding.
   */
  resolved?: KeyCode[] | undefined;
} & Keybinding;

export type ScopedKeybinding = {
  /** Current keybinding scope */
  scope: KeybindingScope;
} & Keybinding;

export const KeybindingContext = Syringe.defineToken('KeybindingContext');
export type KeybindingContext = {
  /**
   * The unique ID of the current context.
   */
  readonly id: string;

  isEnabled: (arg: Keybinding) => boolean;
};
export namespace KeybindingContexts {
  export const NOOP_CONTEXT: KeybindingContext = {
    id: 'noop.keybinding.context',
    isEnabled: () => true,
  };

  export const DEFAULT_CONTEXT: KeybindingContext = {
    id: 'default.keybinding.context',
    isEnabled: () => false,
  };
}

@singleton({ contrib: ApplicationContribution })
export class KeybindingRegistry implements ApplicationContribution {
  preventDefault?: boolean = false;
  stopPropagation?: boolean = false;
  static readonly PASSTHROUGH_PSEUDO_COMMAND = 'passthrough';
  protected keySequence: KeySequence = [];

  protected readonly contexts: Record<string, KeybindingContext> = {};
  protected readonly keymaps: ScopedKeybinding[][] = [
    ...Array(KeybindingScope.length),
  ].map(() => []);

  protected emitter: Emitter<KeybindingRegistry.Match | undefined> = new Emitter();

  protected readonly keyboardLayoutService: KeyboardLayoutService;
  protected readonly contextProvider: Contribution.Provider<KeybindingContext>;
  protected readonly commandRegistry: CommandRegistry;
  protected readonly contributions: Contribution.Provider<KeybindingContribution>;
  protected readonly logger: DebugService;
  protected readonly whenContextService: ContextKeyService;

  constructor(
    @inject(KeyboardLayoutService)
    keyboardLayoutService: KeyboardLayoutService,
    @contrib(KeybindingContext)
    contextProvider: Contribution.Provider<KeybindingContext>,
    @inject(CommandRegistry)
    commandRegistry: CommandRegistry,
    @contrib(KeybindingContribution)
    contributions: Contribution.Provider<KeybindingContribution>,
    @inject(DebugService) logger: DebugService,
    @inject(ContextKeyService)
    whenContextService: ContextKeyService,
  ) {
    this.keyboardLayoutService = keyboardLayoutService;
    this.contextProvider = contextProvider;
    this.commandRegistry = commandRegistry;
    this.contributions = contributions;
    this.logger = logger;
    this.whenContextService = whenContextService;
  }

  async onStart(app: Application): Promise<void> {
    await this.keyboardLayoutService.initialize();
    this.keyboardLayoutService.onKeyboardLayoutChanged(() => {
      this.clearResolvedKeybindings();
      this.keybindingsChanged.fire(undefined);
    });
    this.registerContext(KeybindingContexts.NOOP_CONTEXT);
    this.registerContext(KeybindingContexts.DEFAULT_CONTEXT);
    this.registerContext(...this.contextProvider.getContributions());
    for (const contribution of this.contributions.getContributions()) {
      contribution.registerKeybindings(this);
    }
    app.onKeyDown((event) => {
      if (app.inComposition !== true) {
        this.run(event);
      }
    });
  }

  protected keybindingsChanged = new Emitter<void>();

  /**
   * Event that is fired when the resolved keybindings change due to a different keyboard layout
   * or when a new keymap is being set
   */
  get onKeybindingsChanged(): Event<void> {
    return this.keybindingsChanged.event;
  }

  /**
   * Registers the keybinding context arguments into the application. Fails when an already registered
   * context is being registered.
   *
   * @param contexts the keybinding contexts to register into the application.
   */
  protected registerContext(...contexts: KeybindingContext[]): void {
    for (const context of contexts) {
      const { id } = context;
      if (this.contexts[id]) {
        this.logger(`A keybinding context with ID ${id} is already registered.`);
      } else {
        this.contexts[id] = context;
      }
    }
  }

  /**
   * Register a default keybinding to the registry.
   *
   * Keybindings registered later have higher priority during evaluation.
   *
   * @param binding the keybinding to be registered
   */
  registerKeybinding(binding: Keybinding): Disposable {
    return this.doRegisterKeybinding(binding);
  }

  /**
   * Register multiple default keybindings to the registry
   *
   * @param bindings An array of keybinding to be registered
   */
  registerKeybindings(...bindings: Keybinding[]): Disposable {
    return this.doRegisterKeybindings(bindings, KeybindingScope.DEFAULT);
  }

  /**
   * Unregister all keybindings from the registry that are bound to the key of the given keybinding
   *
   * @param binding a keybinding specifying the key to be unregistered
   */
  unregisterKeybinding(binding: Keybinding): void;
  /**
   * Unregister all keybindings with the given key from the registry
   *
   * @param key a key to be unregistered
   */
  unregisterKeybinding(key: string): void;
  /**
   * Unregister all existing keybindings for the given command
   * @param command the command to unregister all keybindings for
   */
  unregisterKeybinding(command: Command): void;

  unregisterKeybinding(arg: Keybinding | string | Command): void {
    const keymap = this.keymaps[KeybindingScope.DEFAULT];
    const filter = Command.is(arg)
      ? ({ command }: Keybinding) => command === arg.id
      : ({ keybinding }: Keybinding) =>
          Keybinding.is(arg) ? keybinding === arg.keybinding : keybinding === arg;
    for (const binding of keymap.filter(filter)) {
      const idx = keymap.indexOf(binding);
      if (idx !== -1) {
        keymap.splice(idx, 1);
      }
    }
  }

  protected doRegisterKeybindings(
    bindings: Keybinding[],
    scope: KeybindingScope = KeybindingScope.DEFAULT,
  ): Disposable {
    const toDispose = new DisposableCollection();
    for (const binding of bindings) {
      toDispose.push(this.doRegisterKeybinding(binding, scope));
    }
    return toDispose;
  }

  protected doRegisterKeybinding(
    binding: Keybinding,
    scope: KeybindingScope = KeybindingScope.DEFAULT,
  ): Disposable {
    try {
      this.resolveKeybinding(binding);
      const scoped = Object.assign(binding, { scope });
      this.insertBindingIntoScope(scoped, scope);
      return Disposable.create(() => {
        const index = this.keymaps[scope].indexOf(scoped);
        if (index !== -1) {
          this.keymaps[scope].splice(index, 1);
        }
      });
    } catch (error) {
      this.logger(
        `Could not register keybinding:\n  ${Keybinding.stringify(binding)}\n${error}`,
      );
      return Disposable.NONE;
    }
  }

  /**
   * Ensures that keybindings are inserted in order of increasing length of binding to ensure that if a
   * user triggers a short keybinding (e.g. ctrl+k), the UI won't wait for a longer one (e.g. ctrl+k enter)
   */
  protected insertBindingIntoScope(
    item: Keybinding & { scope: KeybindingScope },
    scope: KeybindingScope,
  ): void {
    const scopedKeymap = this.keymaps[scope];
    const getNumberOfKeystrokes = (binding: Keybinding): number =>
      (binding.keybinding.trim().match(/\s/g)?.length ?? 0) + 1;
    const numberOfKeystrokesInBinding = getNumberOfKeystrokes(item);
    const indexOfFirstItemWithEqualStrokes = scopedKeymap.findIndex(
      (existingBinding) =>
        getNumberOfKeystrokes(existingBinding) === numberOfKeystrokesInBinding,
    );
    if (indexOfFirstItemWithEqualStrokes > -1) {
      scopedKeymap.splice(indexOfFirstItemWithEqualStrokes, 0, item);
    } else {
      scopedKeymap.push(item);
    }
  }

  /**
   * Ensure that the `resolved` property of the given binding is set by calling the KeyboardLayoutService.
   */
  resolveKeybinding(binding: ResolvedKeybinding): KeyCode[] {
    if (!binding.resolved) {
      const sequence = KeySequence.parse(binding.keybinding);
      binding.resolved = sequence.map((code) =>
        this.keyboardLayoutService.resolveKeyCode(code),
      );
    }
    return binding.resolved;
  }

  /**
   * Clear all `resolved` properties of registered keybindings so the KeyboardLayoutService is called
   * again to resolve them. This is necessary when the user's keyboard layout has changed.
   */
  protected clearResolvedKeybindings(): void {
    for (let i = KeybindingScope.DEFAULT; i < KeybindingScope.END; i++) {
      const bindings = this.keymaps[i];
      for (let j = 0; j < bindings.length; j++) {
        const binding = bindings[j] as ResolvedKeybinding;
        binding.resolved = undefined;
      }
    }
  }

  /**
   * Checks whether a colliding {@link common.Keybinding} exists in a specific scope.
   * @param binding the keybinding to check
   * @param scope the keybinding scope to check
   * @returns true if there is a colliding keybinding
   */
  containsKeybindingInScope(
    binding: Keybinding,
    scope = KeybindingScope.USER,
  ): boolean {
    const bindingKeySequence = this.resolveKeybinding(binding);
    const collisions = this.getKeySequenceCollisions(
      this.getUsableBindings(this.keymaps[scope]),
      bindingKeySequence,
    ).filter((b) => b.context === binding.context && !b.when && !binding.when);
    if (collisions.full.length > 0) {
      return true;
    }
    if (collisions.partial.length > 0) {
      return true;
    }
    if (collisions.shadow.length > 0) {
      return true;
    }
    return false;
  }

  /**
   * Get a user visible representation of a {@link common.Keybinding}.
   * @returns an array of strings representing all elements of the {@link KeySequence} defined by the {@link common.Keybinding}
   * @param keybinding the keybinding
   * @param separator the separator to be used to stringify {@link KeyCode}s that are part of the {@link KeySequence}
   */
  acceleratorFor(keybinding: Keybinding, separator = ' '): string[] {
    const bindingKeySequence = this.resolveKeybinding(keybinding);
    return this.acceleratorForSequence(bindingKeySequence, separator);
  }

  /**
   * Get a user visible representation of a {@link KeySequence}.
   * @returns an array of strings representing all elements of the {@link KeySequence}
   * @param keySequence the keysequence
   * @param separator the separator to be used to stringify {@link KeyCode}s that are part of the {@link KeySequence}
   */
  acceleratorForSequence(keySequence: KeySequence, separator = ' '): string[] {
    return keySequence.map((keyCode) => this.acceleratorForKeyCode(keyCode, separator));
  }

  /**
   * Get a user visible representation of a key code (a key with modifiers).
   * @returns a string representing the {@link KeyCode}
   * @param keyCode the keycode
   * @param separator the separator used to separate keys (key and modifiers) in the returning string
   */
  acceleratorForKeyCode(keyCode: KeyCode, separator = ' '): string {
    const keyCodeResult = [];
    if (keyCode.meta && isOSX) {
      keyCodeResult.push('Cmd');
    }
    if (keyCode.ctrl) {
      keyCodeResult.push('Ctrl');
    }
    if (keyCode.alt) {
      keyCodeResult.push('Alt');
    }
    if (keyCode.shift) {
      keyCodeResult.push('Shift');
    }
    if (keyCode.key) {
      keyCodeResult.push(this.acceleratorForKey(keyCode.key));
    }
    return keyCodeResult.join(separator);
  }

  /**
   * Return a user visible representation of a single key.
   */
  acceleratorForKey(key: Key): string {
    if (isOSX) {
      if (key === Key.ARROW_LEFT) {
        return '←';
      }
      if (key === Key.ARROW_RIGHT) {
        return '→';
      }
      if (key === Key.ARROW_UP) {
        return '↑';
      }
      if (key === Key.ARROW_DOWN) {
        return '↓';
      }
    }
    const keyString = this.keyboardLayoutService.getKeyboardCharacter(key);
    if (
      (key.keyCode >= Key.KEY_A.keyCode && key.keyCode <= Key.KEY_Z.keyCode) ||
      (key.keyCode >= Key.F1.keyCode && key.keyCode <= Key.F24.keyCode)
    ) {
      return keyString.toUpperCase();
    }
    if (keyString.length > 1) {
      return keyString.charAt(0).toUpperCase() + keyString.slice(1);
    }
    return keyString;
  }

  /**
   * Finds collisions for a key sequence inside a list of bindings (error-free)
   *
   * @param bindings the reference bindings
   * @param candidate the sequence to match
   */
  protected getKeySequenceCollisions(
    bindings: ScopedKeybinding[],
    candidate: KeySequence,
  ): KeybindingRegistry.KeybindingsResult {
    const result = new KeybindingRegistry.KeybindingsResult();
    for (const binding of bindings) {
      try {
        const bindingKeySequence = this.resolveKeybinding(binding);
        const compareResult = KeySequence.compare(candidate, bindingKeySequence);
        switch (compareResult) {
          case KeySequence.CompareResult.FULL: {
            result.full.push(binding);
            break;
          }
          case KeySequence.CompareResult.PARTIAL: {
            result.partial.push(binding);
            break;
          }
          case KeySequence.CompareResult.SHADOW: {
            result.shadow.push(binding);
            break;
          }
        }
      } catch (error) {
        this.logger(error);
      }
    }
    return result;
  }

  /**
   * Get all keybindings associated to a commandId.
   *
   * @param commandId The ID of the command for which we are looking for keybindings.
   * @returns an array of {@link ScopedKeybinding}
   */
  getKeybindingsForCommand(commandId: string): ScopedKeybinding[] {
    const result: ScopedKeybinding[] = [];

    for (
      let scope = KeybindingScope.END - 1;
      scope >= KeybindingScope.DEFAULT;
      scope--
    ) {
      this.keymaps[scope].forEach((binding) => {
        const command = this.commandRegistry.getCommand(binding.command);
        if (command) {
          if (command.id === commandId) {
            result.push({ ...binding, scope });
          }
        }
      });

      if (result.length > 0) {
        return result;
      }
    }
    return result;
  }

  protected isActive(binding: Keybinding): boolean {
    /* Pseudo commands like "passthrough" are always active (and not found
            in the command registry).  */
    if (this.isPseudoCommand(binding.command)) {
      return true;
    }

    const command = this.commandRegistry.getCommand(binding.command);
    return !!command && !!this.commandRegistry.getEnableHandler(command.id);
  }

  /**
   * Tries to execute a keybinding.
   *
   * @param binding to execute
   * @param event keyboard event.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected executeKeyBinding(binding: Keybinding, event: KeyboardEvent): void {
    if (this.isPseudoCommand(binding.command)) {
      /* Don't do anything, let the event propagate.  */
    } else {
      const command = this.commandRegistry.getCommand(binding.command);
      if (command) {
        if (this.commandRegistry.isEnabled(binding.command, binding.args)) {
          this.commandRegistry
            .executeCommand(binding.command, binding.args)
            .catch((e) => console.error('Failed to execute command:', e));
        }

        /* Note that if a keybinding is in context but the command is
                    not active we still stop the processing here.  */
        const {
          preventDefault = this.preventDefault,
          stopPropagation = this.stopPropagation,
        } = binding;
        if (preventDefault) {
          event.preventDefault();
        }
        if (stopPropagation) {
          event.stopPropagation();
        }
      }
    }
  }

  /**
   * Only execute if it has no context (global context) or if we're in that context.
   */
  protected isEnabled(binding: Keybinding, event: KeyboardEvent): boolean {
    const context = binding.context && this.contexts[binding.context];
    if (context && !context.isEnabled(binding)) {
      return false;
    }
    if (
      binding.when &&
      !this.whenContextService.match(binding.when, <HTMLElement>event.target)
    ) {
      return false;
    }
    return true;
  }

  dispatchCommand(id: string, target?: EventTarget): void {
    const keybindings = this.getKeybindingsForCommand(id);
    if (keybindings.length) {
      for (const keyCode of this.resolveKeybinding(keybindings[0])) {
        this.dispatchKeyDown(keyCode, target);
      }
    }
  }

  dispatchKeyDown(
    input: KeyboardEventInit | KeyCode | string,
    target: EventTarget = document.activeElement || window,
  ): void {
    const eventInit = this.asKeyboardEventInit(input);
    const emulatedKeyboardEvent = new KeyboardEvent('keydown', eventInit);
    target.dispatchEvent(emulatedKeyboardEvent);
  }
  protected asKeyboardEventInit(
    input: KeyboardEventInit | KeyCode | string,
  ): KeyboardEventInit & Partial<{ keyCode: number }> {
    if (typeof input === 'string') {
      return this.asKeyboardEventInit(KeyCode.createKeyCode(input));
    }
    if (input instanceof KeyCode) {
      return {
        metaKey: input.meta,
        shiftKey: input.shift,
        altKey: input.alt,
        ctrlKey: input.ctrl,
        code: input.key && input.key.code,
        key: (input && input.character) || (input.key && input.key.code),
        keyCode: (input.key && input.key.keyCode) as number,
      };
    }
    return input;
  }

  /**
   * Run the command matching to the given keyboard event.
   */
  run(event: KeyboardEvent): void {
    if (event.defaultPrevented) {
      return;
    }

    const keyCode = KeyCode.createKeyCode(event, 'code');
    /* Keycode is only a modifier, next keycode will be modifier + key.
            Ignore this one.  */
    if (keyCode.isModifierOnly()) {
      return;
    }

    this.keyboardLayoutService.validateKeyCode(keyCode);
    this.keySequence.push(keyCode);
    const match = this.matchKeybinding(this.keySequence, event);

    if (match && match.kind === 'partial') {
      /* Accumulate the keysequence */
      // TODO: The effective scope of of prevent propagation.
      const {
        preventDefault = this.preventDefault,
        stopPropagation = this.stopPropagation,
      } = match.binding;
      if (preventDefault) {
        event.preventDefault();
      }
      if (stopPropagation) {
        event.stopPropagation();
      }
      this.emitter.fire(match);
    } else {
      if (match && match.kind === 'full') {
        this.executeKeyBinding(match.binding, event);
      }
      this.keySequence = [];
      this.emitter.fire(match);
    }
  }

  onMatchChange(callback: (match?: KeybindingRegistry.Match) => void) {
    this.emitter.event(callback);
  }

  /**
   * Match first binding in the current context.
   * Keybindings ordered by a scope and by a registration order within the scope.
   *
   * FIXME:
   * This method should run very fast since it happens on each keystroke. We should reconsider how keybindings are stored.
   * It should be possible to look up full and partial keybinding for given key sequence for constant time using some kind of tree.
   * Such tree should not contain disabled keybindings and be invalidated whenever the registry is changed.
   */
  matchKeybinding(
    keySequence: KeySequence,
    event?: KeyboardEvent,
  ): KeybindingRegistry.Match {
    let disabled: Set<string> | undefined;
    const isEnabled = (binding: ScopedKeybinding) => {
      if (event && !this.isEnabled(binding, event)) {
        return false;
      }
      const { command, context, when, keybinding } = binding;
      if (!this.isUsable(binding)) {
        disabled = disabled || new Set<string>();
        disabled.add(
          JSON.stringify({ command: command.substr(1), context, when, keybinding }),
        );
        return false;
      }
      return !disabled?.has(JSON.stringify({ command, context, when, keybinding }));
    };

    for (let scope = KeybindingScope.END; --scope >= KeybindingScope.DEFAULT; ) {
      for (const binding of this.keymaps[scope]) {
        const resolved = this.resolveKeybinding(binding);
        const compareResult = KeySequence.compare(keySequence, resolved);
        if (compareResult === KeySequence.CompareResult.FULL && isEnabled(binding)) {
          return { kind: 'full', binding };
        }
        if (compareResult === KeySequence.CompareResult.PARTIAL && isEnabled(binding)) {
          return { kind: 'partial', binding };
        }
      }
    }
    return undefined;
  }

  /**
   * Returns true if the binding is usable
   * @param binding Binding to be checked
   */
  protected isUsable(binding: Keybinding): boolean {
    return binding.command.charAt(0) !== '-';
  }

  /**
   * Return a new filtered array containing only the usable bindings among the input bindings
   * @param bindings Bindings to filter
   */
  protected getUsableBindings<T extends Keybinding>(bindings: T[]): T[] {
    return bindings.filter((binding) => this.isUsable(binding));
  }

  /**
   * Return true of string a pseudo-command id, in other words a command id
   * that has a special meaning and that we won't find in the command
   * registry.
   *
   * @param commandId commandId to test
   */
  isPseudoCommand(commandId: string): boolean {
    return commandId === KeybindingRegistry.PASSTHROUGH_PSEUDO_COMMAND;
  }

  /**
   * Sets a new keymap replacing all existing {@link common.Keybinding}s in the given scope.
   * @param scope the keybinding scope
   * @param bindings an array containing the new {@link common.Keybinding}s
   */
  setKeymap(scope: KeybindingScope, bindings: Keybinding[]): void {
    this.resetKeybindingsForScope(scope);
    this.toResetKeymap.set(scope, this.doRegisterKeybindings(bindings, scope));
    this.keybindingsChanged.fire(undefined);
  }

  protected readonly toResetKeymap = new Map<KeybindingScope, Disposable>();

  /**
   * Reset keybindings for a specific scope
   * @param scope scope to reset the keybindings for
   */
  resetKeybindingsForScope(scope: KeybindingScope): void {
    const toReset = this.toResetKeymap.get(scope);
    if (toReset) {
      toReset.dispose();
    }
  }

  /**
   * Reset keybindings for all scopes(only leaves the default keybindings mapped)
   */
  resetKeybindings(): void {
    for (let i = KeybindingScope.DEFAULT + 1; i < KeybindingScope.END; i++) {
      this.keymaps[i] = [];
    }
  }

  /**
   * Get all {@link common.Keybinding}s for a {@link KeybindingScope}.
   * @returns an array of {@link common.ScopedKeybinding}
   * @param scope the keybinding scope to retrieve the {@link common.Keybinding}s for.
   */
  getKeybindingsByScope(scope: KeybindingScope): ScopedKeybinding[] {
    return this.keymaps[scope];
  }
}

export namespace KeybindingRegistry {
  export type Match =
    | {
        kind: 'full' | 'partial';
        binding: ScopedKeybinding;
        preventDefault?: boolean;
        stopPropagation?: boolean;
      }
    | undefined;
  export class KeybindingsResult {
    full: ScopedKeybinding[] = [];
    partial: ScopedKeybinding[] = [];
    shadow: ScopedKeybinding[] = [];

    /**
     * Merge two results together inside `this`
     *
     * @param other the other KeybindingsResult to merge with
     * @return this
     */
    merge(other: KeybindingsResult): KeybindingsResult {
      this.full.push(...other.full);
      this.partial.push(...other.partial);
      this.shadow.push(...other.shadow);
      return this;
    }

    /**
     * Returns a new filtered KeybindingsResult
     *
     * @param fn callback filter on the results
     * @return filtered new result
     */
    filter(fn: (binding: Keybinding) => boolean): KeybindingsResult {
      const result = new KeybindingsResult();
      result.full = this.full.filter(fn);
      result.partial = this.partial.filter(fn);
      result.shadow = this.shadow.filter(fn);
      return result;
    }
  }
}
