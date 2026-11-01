
import { NexoraEventBus } from '../eventbus/NexoraEventBus';
import { TaskStateManager } from '../state/TaskStateManager';
import { ReActPlanner } from '../../brain/planner/ReActPlanner';
import { ToolRegistry } from '../../tools/ToolRegistry';
import { RiskGateManager } from '../../safety/RiskGateManager';
import { UiNodeParser } from '../../accessibility/UiNodeParser';
import { deviceManager } from '../../simulator/DeviceContext';
import { TaskState, TaskStepLog } from '../../types';

export class TaskOrchestrator {
  private isCancelled = false;
  private isDestroyed = false;
  private currentTaskId = 0;

  private stepLogs: TaskStepLog[] = [];
  private stepLogListeners: Set<(logs: TaskStepLog[]) => void> =
    new Set();

  private nodeParser = new UiNodeParser();
  private unsubscribeEventBus: (() => void) | null = null;

  private static readonly MAX_STEPS = 8;
  private static readonly MAX_ELEMENTS = 60;
  private static readonly STEP_DELAY_MS = 800;

  constructor(
    private taskStateManager: TaskStateManager,
    private planner: ReActPlanner,
    private toolRegistry: ToolRegistry,
    private riskGate: RiskGateManager
  ) {
    this.initEventSubscriber();
  }

  private initEventSubscriber(): void {
    this.unsubscribeEventBus = NexoraEventBus.subscribe((event) => {
      if (this.isDestroyed) return;

      switch (event.type) {
        case 'UserSpokenInput':
          this.cancelCurrent();
          void this.runTask(event.transcript);
          break;

        case 'StopRequested':
          this.cancelCurrent();
          this.taskStateManager.transitionTo(TaskState.IDLE);
          break;
      }
    });
  }

  cancelCurrent(): void {
    this.isCancelled = true;
    this.currentTaskId++;
  }

  destroy(): void {
    if (this.isDestroyed) return;

    this.isDestroyed = true;
    this.cancelCurrent();

    this.unsubscribeEventBus?.();
    this.unsubscribeEventBus = null;

    this.stepLogListeners.clear();
  }

  getStepLogs(): TaskStepLog[] {
    return [...this.stepLogs];
  }

  onStepLogs(fn: (logs: TaskStepLog[]) => void): () => void {
    if (this.isDestroyed) return () => {};

    this.stepLogListeners.add(fn);

    try {
      fn(this.getStepLogs());
    } catch (error) {
      console.error('TaskOrchestrator log listener error:', error);
    }

    return () => {
      this.stepLogListeners.delete(fn);
    };
  }

  private notifyStepLogListeners(): void {
    const snapshot = this.getStepLogs();

    this.stepLogListeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (error) {
        console.error('TaskOrchestrator log listener error:', error);
      }
    });
  }

  private addStepLog(log: TaskStepLog): void {
    this.stepLogs = [...this.stepLogs, log];
    this.notifyStepLogListeners();
  }

  private isTaskActive(taskId: number): boolean {
    return (
      !this.isDestroyed &&
      !this.isCancelled &&
      this.currentTaskId === taskId
    );
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return String(error || 'Unknown error');
  }

  async runTask(query: string): Promise<void> {
    if (this.isDestroyed) return;

    const taskId = ++this.currentTaskId;

    this.isCancelled = false;
    this.stepLogs = [];
    this.notifyStepLogListeners();

    const history: string[] = [];

    try {
      if (!query || !query.trim()) {
        this.taskStateManager.transitionTo(TaskState.FAILED);
        return;
      }

      this.taskStateManager.transitionTo(TaskState.PLANNING);

      for (
        let step = 1;
        step <= TaskOrchestrator.MAX_STEPS;
        step++
      ) {
        if (!this.isTaskActive(taskId)) return;

        const screenDesc = this.describeScreen();

        const plan = await this.planner.planNextStep(
          query,
          this.toolRegistry.getToolsJsonSchema(),
          screenDesc,
          history
        );

        if (!this.isTaskActive(taskId)) return;

        if (
          plan.finalResponseToUser &&
          plan.finalResponseToUser.trim().length > 0
        ) {
          NexoraEventBus.emit({
            type: 'SpeakFeedback',
            text: plan.finalResponseToUser,
          });
        }

        const toolName = plan.selectedTool?.trim() || null;

        if (!toolName) {
          this.addStepLog({
            step,
            reasoning: plan.reasoning || '',
            timestamp: new Date().toLocaleTimeString(),
            screenSummary: screenDesc.slice(0, 150),
          });

          this.taskStateManager.transitionTo(TaskState.COMPLETED);
          return;
        }

        const tool = this.toolRegistry.getTool(toolName);

        if (!tool) {
          const message = `Tool '${toolName}' does not exist`;

          history.push(message);

          this.addStepLog({
            step,
            reasoning: plan.reasoning || '',
            toolName,
            parameters: plan.toolParameters,
            result: {
              success: false,
              message,
            },
            timestamp: new Date().toLocaleTimeString(),
            screenSummary: screenDesc.slice(0, 150),
          });

          continue;
        }

        this.taskStateManager.transitionTo(TaskState.EXECUTING);

        const canExecute =
          await this.riskGate.evaluateAndCanExecute(
            tool,
            plan.toolParameters
          );

        if (!this.isTaskActive(taskId)) return;

        if (!canExecute) {
          const message = `Blocked by RiskGate (${tool.riskLevel})`;

          history.push(`User did not allow ${tool.name}`);

          this.addStepLog({
            step,
            reasoning: plan.reasoning || '',
            toolName: tool.name,
            parameters: plan.toolParameters,
            result: {
              success: false,
              message,
            },
            timestamp: new Date().toLocaleTimeString(),
            screenSummary: screenDesc.slice(0, 150),
          });

          this.taskStateManager.transitionTo(TaskState.PLANNING);
          continue;
        }

        const result = await tool.execute(
          plan.toolParameters
        );

        if (!this.isTaskActive(taskId)) return;

        history.push(
          result.success
            ? `${tool.name}: ${result.message}`
            : `${tool.name} failed: ${result.message}`
        );

        this.addStepLog({
          step,
          reasoning: plan.reasoning || '',
          toolName: tool.name,
          parameters: plan.toolParameters,
          result,
          timestamp: new Date().toLocaleTimeString(),
          screenSummary: screenDesc.slice(0, 150),
        });

        if (plan.isTaskComplete) {
          this.taskStateManager.transitionTo(TaskState.COMPLETED);
          return;
        }

        await new Promise<void>((resolve) => {
          setTimeout(resolve, TaskOrchestrator.STEP_DELAY_MS);
        });

        if (!this.isTaskActive(taskId)) return;

        this.taskStateManager.transitionTo(TaskState.PLANNING);
      }

      if (!this.isTaskActive(taskId)) return;

      NexoraEventBus.emit({
        type: 'SpeakFeedback',
        text: 'Kaaj-ta shesh korte parlam na.',
      });

      this.taskStateManager.transitionTo(TaskState.FAILED);
    } catch (error) {
      if (!this.isTaskActive(taskId)) return;

      const message = this.getErrorMessage(error);

      console.error('TaskOrchestrator execution error:', error);

      this.addStepLog({
        step: this.stepLogs.length + 1,
        reasoning: 'Task execution stopped because an error occurred.',
        result: {
          success: false,
          message,
        },
        timestamp: new Date().toLocaleTimeString(),
        screenSummary: 'Task execution error',
      });

      NexoraEventBus.emit({
        type: 'ErrorOccurred',
        message: `Task failed: ${message}`,
      });

      NexoraEventBus.emit({
        type: 'SpeakFeedback',
        text: 'Task-ti complete kora jayni. Ekti error hoyeche.',
      });

      this.taskStateManager.transitionTo(TaskState.FAILED);
    }
  }

  describeScreen(): string {
    try {
      const screenState = deviceManager.getScreenState();

      const root =
        screenState?.screenRef ||
        document.getElementById('nexora-virtual-screen');

      if (!root) {
        return 'Accessibility service off / screen not loaded';
      }

      const elements = this.nodeParser.parseTree(root);

      return elements
        .slice(0, TaskOrchestrator.MAX_ELEMENTS)
        .map((element) => {
          const label =
            element.text ||
            element.contentDescription ||
            '(no label)';

          const kind = element.isClickable
            ? 'clickable'
            : element.isEditable
              ? 'editable'
              : 'text';

          return `- [${kind}] ${label}`;
        })
        .join('\n');
    } catch (error) {
      console.error('Screen description error:', error);
      return 'Screen information is currently unavailable';
    }
  }
}
