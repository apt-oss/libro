import {
  Emitter,
  WaitUntilEvent,
  Disposable,
  DisposableCollection,
} from '../../common/index.js';
import type { Contribution } from '../../ioc/index.js';
import { Syringe } from '../../ioc/index.js';
import { contrib, singleton } from '../../ioc/index.js';
import { prop } from '../../observable/index.js';
import { ApplicationContribution } from '../application/application.js';

import type {
  CommandEvent,
  CommandHandler,
  CommandHandlerWithContext,
  ActiveHandler,
  EnabledHandler,
  VisibleHandler,
  WillExecuteCommandEvent,
  ExecuteHandler,
} from './command-protocol.js';
import { Command, CommandService } from './command-protocol.js';

export const CommandContribution = Syringe.defineToken('CommandContribution');
/**
 * The command contribution should be implemented to register custom commands and handler.
 */
export type CommandContribution = {
  /**
   * Register commands and handlers.
   */
  registerCommands: (commands: CommandRegistry) => void;
};
/**
 * The command registry manages commands and handlers.
 */
@singleton({ contrib: [CommandService, ApplicationContribution] })
export class CommandRegistry implements CommandService, ApplicationContribution {
  @prop() readonly commandMap: Record<string, Command> = {};
  @prop() readonly ctxMap: Record<string, any> = {};
  protected readonly _handlers: Record<string, CommandHandler[]> = {};

  protected readonly toUnregisterCommands = new Map<string, Disposable>();

  // List of recently used commands.
  @prop() protected recent: Command[] = [];

  protected readonly onWillExecuteCommandEmitter =
    new Emitter<WillExecuteCommandEvent>();
  readonly onWillExecuteCommand = this.onWillExecuteCommandEmitter.event;

  protected readonly onDidExecuteCommandEmitter = new Emitter<CommandEvent>();
  readonly onDidExecuteCommand = this.onDidExecuteCommandEmitter.event;
  protected readonly contributionProvider: Contribution.Provider<CommandContribution>;

  constructor(
    @contrib(CommandContribution)
    contributionProvider: Contribution.Provider<CommandContribution>,
  ) {
    this.contributionProvider = contributionProvider;
  }

  onStart(): void {
    const contributions = this.contributionProvider.getContributions();
    for (const contribution of contributions) {
      contribution.registerCommands(this);
    }
  }

  /**
   * Register the given command and handler if present.
   *
   * Throw if a command is already registered for the given command identifier.
   */
  registerCommand(command: Command, handler?: CommandHandler): Disposable {
    if (this.commandMap[command.id]) {
      console.warn(`A command ${command.id} is already registered.`);
      return Disposable.NONE;
    }
    const toDispose = new DisposableCollection(this.doRegisterCommand(command));
    if (handler) {
      toDispose.push(this.registerHandler(command.id, handler));
    }
    this.toUnregisterCommands.set(command.id, toDispose);
    toDispose.push(
      Disposable.create(() => this.toUnregisterCommands.delete(command.id)),
    );
    return toDispose;
  }

  /**
   * Register the given command with context, and handler if present.
   *
   * Throw if a command is already registered for the given command identifier.
   */
  registerCommandWithContext<T = any>(
    command: Command,
    ctx: T,
    handler?: CommandHandlerWithContext<T>,
  ): Disposable {
    const toDispose = new DisposableCollection();
    if (this.commandMap[command.id] && !this.ctxMap[command.id]) {
      console.warn(
        `A command ${command.id} is already registered and has no registered context.`,
      );
      return Disposable.NONE;
    }
    toDispose.push(this.registerCommand(command, handler));
    toDispose.push(this.doRegisterCommandCtx(command, ctx));
    return toDispose;
  }

  protected doRegisterCommandCtx(command: Command, ctx: any): Disposable {
    this.ctxMap[command.id] = ctx;
    return {
      dispose: () => {
        delete this.ctxMap[command.id];
      },
    };
  }

  protected doRegisterCommand(command: Command): Disposable {
    this.commandMap[command.id] = command;
    return {
      dispose: () => {
        delete this.commandMap[command.id];
      },
    };
  }

  /**
   * Unregister command from the registry
   *
   * @param command
   */
  unregisterCommand(command: Command): void;
  /**
   * Unregister command from the registry
   *
   * @param id
   */
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  unregisterCommand(id: string): void;
  unregisterCommand(commandOrId: Command | string): void {
    const id = Command.is(commandOrId) ? commandOrId.id : commandOrId;
    const toUnregister = this.toUnregisterCommands.get(id);
    if (toUnregister) {
      toUnregister.dispose();
    }
  }

  /**
   * Register the given handler for the given command identifier.
   *
   * If there is already a handler for the given command
   * then the given handler is registered as more specific, and
   * has higher priority during enablement, visibility and toggle state evaluations.
   */
  registerHandler(commandId: string, handler: CommandHandler): Disposable {
    let handlers = this._handlers[commandId];
    if (!handlers) {
      // eslint-disable-next-line no-multi-assign
      this._handlers[commandId] = handlers = [];
    }
    handlers.unshift(handler);
    return {
      dispose: () => {
        const idx = handlers.indexOf(handler);
        if (idx >= 0) {
          handlers.splice(idx, 1);
        }
      },
    };
  }

  /**
   * Test whether there is an active handler for the given command.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isEnabled(command: string, ...args: any[]): boolean {
    return typeof this.getEnableHandler(command, ...args) !== 'undefined';
  }

  /**
   * Test whether there is a visible handler for the given command.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isVisible(command: string, ...args: any[]): boolean {
    return typeof this.getVisibleHandler(command, ...args) !== 'undefined';
  }

  /**
   * Test whether there is a active handler for the given command.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isActive(command: string, ...args: any[]): boolean {
    return typeof this.getActiveHandler(command, ...args) !== 'undefined';
  }

  toContextArgs(commandId: string, ...args: any[]): any[] {
    const ctx = this.ctxMap[commandId];
    if (ctx) {
      return [ctx, ...args];
    }
    return args;
  }

  /**
   * Test whether there is an active handler for the given command.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isEnabledByHandler(
    handler: EnabledHandler,
    command: string,
    ...args: any[]
  ): boolean {
    const contextArgs = this.toContextArgs(command, ...args);
    if (handler.isEnabled) {
      return handler.isEnabled(...contextArgs);
    }
    return typeof this.getEnableHandler(command, ...args) !== 'undefined';
  }

  /**
   * Test whether there is a visible handler for the given command.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isVisibleByHandler(
    handler: VisibleHandler,
    command: string,
    ...args: any[]
  ): boolean {
    const contextArgs = this.toContextArgs(command, ...args);
    if (handler.isVisible) {
      return handler.isVisible(...contextArgs);
    }
    return typeof this.getVisibleHandler(command, ...args) !== 'undefined';
  }

  /**
   * Test whether there is a active handler for the given command.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isActiveByHandler(handler: ActiveHandler, command: string, ...args: any[]): boolean {
    const contextArgs = this.toContextArgs(command, ...args);
    if (handler.isActive) {
      return handler.isActive(...contextArgs);
    }
    return typeof this.getActiveHandler(command, ...args) !== 'undefined';
  }

  /**
   * Execute the given handler for the given command and arguments.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  executeCommandByHandler<T>(
    handler: ExecuteHandler,
    command: string,
    ...args: any[]
  ): Promise<T | undefined> {
    const contextArgs = this.toContextArgs(command, ...args);
    if (handler.execute) {
      return handler.execute(...contextArgs);
    }
    return this.executeCommand(command, ...args);
  }

  /**
   * Execute the active handler for the given command and arguments.
   *
   * Reject if a command cannot be executed.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async executeCommand<T>(commandId: string, ...args: any[]): Promise<T | undefined> {
    const handler = this.getEnableHandler(commandId, ...args);
    if (handler) {
      const contextArgs = this.toContextArgs(commandId, ...args);
      await this.fireWillExecuteCommand(commandId, contextArgs);
      const result = await handler.execute(...contextArgs);
      this.onDidExecuteCommandEmitter.fire({ commandId, args: contextArgs });
      return result;
    }
    throw Object.assign(
      new Error(
        `The command '${commandId}' cannot be executed. There are no active handlers available for the command.`,
      ),
      { code: 'NO_ACTIVE_HANDLER' },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected async fireWillExecuteCommand(
    commandId: string,
    args: any[] = [],
  ): Promise<void> {
    await WaitUntilEvent.fire(
      this.onWillExecuteCommandEmitter,
      { commandId, args },
      30000,
    );
  }

  /**
   * Get a visible handler for the given command or `undefined`.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getVisibleHandler(commandId: string, ...args: any[]): CommandHandler | undefined {
    const contextArgs = this.toContextArgs(commandId, ...args);
    const handlers = this._handlers[commandId];
    if (handlers) {
      for (const handler of handlers) {
        try {
          if (!handler.isVisible || handler.isVisible(...contextArgs)) {
            return handler;
          }
        } catch (error) {
          console.error(error);
        }
      }
    }
    return undefined;
  }

  /**
   * Get an enable handler for the given command or `undefined`.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getEnableHandler(commandId: string, ...args: any[]): CommandHandler | undefined {
    const contextArgs = this.toContextArgs(commandId, ...args);
    const handlers = this._handlers[commandId];
    if (handlers) {
      for (const handler of handlers) {
        try {
          if (!handler.isEnabled || handler.isEnabled(...contextArgs)) {
            return handler;
          }
        } catch (error) {
          console.error(error);
        }
      }
    }
    return undefined;
  }

  /**
   * Get an active handler for the given command or `undefined`.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getActiveHandler(commandId: string, ...args: any[]): CommandHandler | undefined {
    const contextArgs = this.toContextArgs(commandId, ...args);
    const handlers = this._handlers[commandId];
    if (handlers) {
      for (const handler of handlers) {
        try {
          if (handler.isActive && handler.isActive(...contextArgs)) {
            return handler;
          }
        } catch (error) {
          console.error(error);
        }
      }
    }
    return undefined;
  }

  /**
   * Returns with all handlers for the given command. If the command does not have any handlers,
   * or the command is not registered, returns an empty array.
   */
  getAllHandlers(commandId: string): CommandHandler[] {
    const handlers = this._handlers[commandId];
    return handlers ? handlers.slice() : [];
  }

  /**
   * Get all registered commands.
   */
  get commands(): Command[] {
    const commands: Command[] = [];
    for (const id of this.commandIds) {
      const cmd = this.getCommand(id);
      if (cmd) {
        commands.push(cmd);
      }
    }
    return commands;
  }

  /**
   * Get a command for the given command identifier.
   */
  getCommand(id: string): Command | undefined {
    return this.commandMap[id];
  }

  /**
   * Get all registered commands identifiers.
   */
  get commandIds(): string[] {
    return Object.keys(this.commandMap);
  }
  /**
   * Adds a command to recently used list.
   * Prioritizes commands that were recently executed to be most recent.
   *
   * @param recent a recent command, or array of recent commands.
   */
  addRecentCommand(recent: Command | Command[]): void {
    if (Array.isArray(recent)) {
      recent.forEach((command: Command) => this.addRecentCommand(command));
    } else {
      // Determine if the command currently exists in the recently used list.
      const index = this.recent.findIndex((command: Command) =>
        Command.equals(recent, command),
      );
      // If the command exists, remove it from the array so it can later be placed at the top.
      if (index >= 0) {
        this.recent.splice(index, 1);
      }
      // Add the recent command to the beginning of the array (most recent).
      this.recent.unshift(recent);
    }
  }

  /**
   * Clear the list of recently used commands.
   */
  clearCommandHistory(): void {
    this.recent = [];
  }
}
