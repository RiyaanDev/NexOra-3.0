
import { NexoraTool, RiskTier } from '../types';
import { UserConfirmationCallback } from './UserConfirmationCallback';

export class RiskGateManager {
  private isAdminModeAuthorized = false;

  constructor(
    private confirmationCallback: UserConfirmationCallback
  ) {}

  setConfirmationCallback(
    callback: UserConfirmationCallback
  ): void {
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
    switch (tool.riskLevel) {
      case RiskTier.LOW:
        // Low-risk actions can execute without confirmation.
        return true;

      case RiskTier.MEDIUM:
      case RiskTier.HIGH:
      case RiskTier.CRITICAL:
        // Elevated-risk actions ALWAYS require explicit user approval.
        // Admin mode must never bypass this safety check.
        return await this.confirmationCallback.requestConfirmation(
          tool,
          parameters,
          `Tool '${tool.name}' requires explicit user confirmation (${tool.riskLevel}).`
        );

      default:
        // Unknown risk levels must be blocked.
        return false;
    }
  }
}
