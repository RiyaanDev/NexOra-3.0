
import { NexoraTool, RiskTier } from '../types';
import { UserConfirmationCallback } from './UserConfirmationCallback';

export class RiskGateManager {
  private isAdminModeAuthorized = false;

  constructor(private confirmationCallback: UserConfirmationCallback) {}

  setConfirmationCallback(callback: UserConfirmationCallback): void {
    this.confirmationCallback = callback;
  }

  getConfirmationCallback(): UserConfirmationCallback {
    return this.confirmationCallback;
  }

  setAdminModeAuthorized(authorized: boolean): void {
    this.isAdminModeAuthorized = authorized;
  }

  getAdminModeAuthorized(): boolean {
    return this.isAdminModeAuthorized;
  }

  async evaluateAndCanExecute(
    tool: NexoraTool,
    parameters: Record<string, any>
  ): Promise<boolean> {
    if (this.isAdminModeAuthorized) {
      return true;
    }

    switch (tool.riskLevel) {
      case RiskTier.LOW:
        return true;

      case RiskTier.MEDIUM:
      case RiskTier.HIGH:
      case RiskTier.CRITICAL:
        return await this.confirmationCallback.requestConfirmation(
          tool,
          parameters,
          `Tool '${tool.name}' requires confirmation (${tool.riskLevel}).`
        );

      default:
        return false;
    }
  }
}
