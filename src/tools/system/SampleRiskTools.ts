
import { NexoraTool, RiskTier, ToolResult } from '../../types';

/**
 * These tools are currently placeholders.
 * They do NOT perform real Android device actions.
 * They must report failure until native implementations exist.
 */

export class SendMessageTool implements NexoraTool {
  readonly name = 'send_message';

  readonly description =
    'Placeholder: sending real SMS messages is not implemented yet.';

  readonly riskLevel = RiskTier.HIGH;

  async execute(
    _parameters: Record<string, any>
  ): Promise<ToolResult> {
    return {
      success: false,
      message:
        'SMS sending is not implemented. Native Android SMS integration is required.',
    };
  }
}

export class ModifySettingTool implements NexoraTool {
  readonly name = 'modify_system_setting';

  readonly description =
    'Placeholder: modifying real Android system settings is not implemented yet.';

  readonly riskLevel = RiskTier.MEDIUM;

  async execute(
    _parameters: Record<string, any>
  ): Promise<ToolResult> {
    return {
      success: false,
      message:
        'System setting modification is not implemented. Native Android integration and required permissions are needed.',
    };
  }
}

export class ClearAppDataTool implements NexoraTool {
  readonly name = 'clear_app_data';

  readonly description =
    'Placeholder: clearing real Android application data is not implemented yet.';

  readonly riskLevel = RiskTier.CRITICAL;

  async execute(
    _parameters: Record<string, any>
  ): Promise<ToolResult> {
    return {
      success: false,
      message:
        'App data deletion is not implemented. No application data was deleted.',
    };
  }
}
