
import { TaskState } from '../../types';
import { NexoraEventBus } from '../eventbus/NexoraEventBus';

type StateChangeListener = (state: TaskState) => void;

export class TaskStateManager {
  private currentState: TaskState = TaskState.IDLE;

  private stateChangeListeners: Set<StateChangeListener> =
    new Set();

  transitionTo(state: TaskState): void {
    const oldState = this.currentState;

    if (oldState === state) return;

    this.currentState = state;

    NexoraEventBus.emit({
      type: 'StateChanged',
      oldState,
      newState: state,
    });

    this.stateChangeListeners.forEach((listener) => {
      try {
        listener(state);
      } catch (error) {
        console.error(
          'TaskStateManager listener error:',
          error
        );
      }
    });
  }

  getCurrentState(): TaskState {
    return this.currentState;
  }

  reset(): void {
    this.transitionTo(TaskState.IDLE);
  }

  onStateChange(fn: StateChangeListener): () => void {
    this.stateChangeListeners.add(fn);

    // Immediately provide the current state.
    fn(this.currentState);

    // Return unsubscribe function.
    return () => {
      this.stateChangeListeners.delete(fn);
    };
  }

  clearListeners(): void {
    this.stateChangeListeners.clear();
  }
}
