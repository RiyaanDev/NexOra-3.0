
import { NexoraTool } from '../types';
import { UserConfirmationCallback } from './UserConfirmationCallback';

export interface PendingConfirmationRequest {
  id: string;
  tool: NexoraTool;
  parameters: Record<string, any>;
  explanation: string;
  resolve: (allowed: boolean) => void;
}

export class InteractiveConfirmation
  implements UserConfirmationCallback
{
  private pendingRequests: PendingConfirmationRequest[] = [];

  private listeners: Set<
    (req: PendingConfirmationRequest | null) => void
  > = new Set();

  private requestCounter = 0;

  requestConfirmation(
    tool: NexoraTool,
    parameters: Record<string, any>,
    explanation: string
  ): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.requestCounter++;

      const request: PendingConfirmationRequest = {
        id: `confirmation-${Date.now()}-${this.requestCounter}`,
        tool,
        parameters,
        explanation,
        resolve,
      };

      this.pendingRequests.push(request);
      this.notify();
    });
  }

  getCurrentRequest(): PendingConfirmationRequest | null {
    return this.pendingRequests[0] || null;
  }

  getPendingCount(): number {
    return this.pendingRequests.length;
  }

  respond(allowed: boolean): void {
    const request = this.pendingRequests.shift();

    if (!request) return;

    try {
      request.resolve(allowed);
    } finally {
      this.notify();
    }
  }

  denyCurrent(): void {
    this.respond(false);
  }

  subscribe(
    fn: (req: PendingConfirmationRequest | null) => void
  ): () => void {
    this.listeners.add(fn);

    try {
      fn(this.getCurrentRequest());
    } catch (error) {
      console.error(
        'InteractiveConfirmation subscriber error:',
        error
      );
    }

    return () => {
      this.listeners.delete(fn);
    };
  }

  private notify(): void {
    const currentRequest = this.getCurrentRequest();

    this.listeners.forEach((listener) => {
      try {
        listener(currentRequest);
      } catch (error) {
        console.error(
          'InteractiveConfirmation listener error:',
          error
        );
      }
    });
  }
}

export const interactiveConfirmation =
  new InteractiveConfirmation();
