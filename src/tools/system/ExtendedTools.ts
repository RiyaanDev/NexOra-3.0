
import {
  NexoraTool,
  RiskTier,
  ToolResult,
} from '../../types';

import { deviceManager } from '../../simulator/DeviceContext';

/**
 * IMPORTANT:
 * These tools currently operate on the NEXORA Virtual Device Simulator.
 * They do not control real Android calls, contacts, messages or apps.
 */

// -----------------------------------------
// CALL TOOLS — SIMULATOR ONLY
// -----------------------------------------

export class AnswerCallTool implements NexoraTool {
  readonly name = 'answer_call';

  readonly description =
    'Answers a simulated incoming call in the NEXORA Virtual Device.';

  readonly riskLevel = RiskTier.HIGH;

  async execute(
    _parameters: Record<string, any>
  ): Promise<ToolResult> {
    const screenState = deviceManager.getScreenState();

    if (!screenState?.answerCall) {
      return {
        success: false,
        message: 'Virtual call control is not available.',
      };
    }

    screenState.answerCall();

    return {
      success: true,
      message: 'Virtual incoming call answer action requested. Check the simulator.',
    };
  }
}

export class CutCallTool implements NexoraTool {
  readonly name = 'cut_call';

  readonly description =
    'Rejects or disconnects a simulated call in the NEXORA Virtual Device.';

  readonly riskLevel = RiskTier.HIGH;

  async execute(
    _parameters: Record<string, any>
  ): Promise<ToolResult> {
    const screenState = deviceManager.getScreenState();

    if (!screenState?.cutCall) {
      return {
        success: false,
        message: 'Virtual call control is not available.',
      };
    }

    screenState.cutCall();

    return {
      success: true,
      message: 'Virtual call disconnect action requested. Check the simulator.',
    };
  }
}

export class MakeCallTool implements NexoraTool {
  readonly name = 'make_call';

  readonly description =
    'Starts a simulated outgoing call in the NEXORA Virtual Device.';

  readonly riskLevel = RiskTier.HIGH;

  async execute(
    parameters: Record<string, any>
  ): Promise<ToolResult> {
    const target =
      parameters['contactName'] ||
      parameters['phoneNumber'];

    if (
      typeof target !== 'string' ||
      !target.trim()
    ) {
      return {
        success: false,
        message: 'A contactName or phoneNumber is required.',
      };
    }

    const screenState = deviceManager.getScreenState();

    if (!screenState?.placeCall) {
      return {
        success: false,
        message: 'Virtual call control is not available.',
      };
    }

    screenState.placeCall(target.trim());

    return {
      success: true,
      message: `Virtual call action requested for ${target.trim()}. No real phone call was placed.`,
    };
  }
}

// -----------------------------------------
// SEARCH TOOL — SIMULATOR ONLY
// -----------------------------------------

export class SearchTool implements NexoraTool {
  readonly name = 'search_query';

  readonly description =
    'Opens a simulated browser search for a query in the NEXORA Virtual Device.';

  readonly riskLevel = RiskTier.LOW;

  async execute(
    parameters: Record<string, any>
  ): Promise<ToolResult> {
    const query =
      parameters['query'] ||
      parameters['text'];

    if (
      typeof query !== 'string' ||
      !query.trim()
    ) {
      return {
        success: false,
        message: 'A search query is required.',
      };
    }

    const screenState = deviceManager.getScreenState();

    if (!screenState?.performSearch) {
      return {
        success: false,
        message: 'Virtual search is not available.',
      };
    }

    screenState.performSearch(query.trim());

    return {
      success: true,
      message: `Virtual browser search requested for "${query.trim()}". This is not a verified live web search.`,
    };
  }
}

// -----------------------------------------
// CREATE TOOL — SIMULATOR ONLY
// -----------------------------------------

export class CreateItemTool implements NexoraTool {
  readonly name = 'create_item';

  readonly description =
    'Creates a simulated note or contact in the NEXORA Virtual Device.';

  readonly riskLevel = RiskTier.LOW;

  async execute(
    parameters: Record<string, any>
  ): Promise<ToolResult> {
    const type = parameters['type'] || 'note';

    const content =
      parameters['content'] ||
      parameters['title'] ||
      parameters['name'];

    if (
      typeof content !== 'string' ||
      !content.trim()
    ) {
      return {
        success: false,
        message: 'Content, title or name is required.',
      };
    }

    if (type !== 'note' && type !== 'contact') {
      return {
        success: false,
        message: 'The simulator currently supports only note and contact creation.',
      };
    }

    const screenState = deviceManager.getScreenState();

    if (!screenState?.createItem) {
      return {
        success: false,
        message: 'Virtual item creation is not available.',
      };
    }

    screenState.createItem(type, content.trim());

    return {
      success: true,
      message: `Virtual ${type} creation requested. Check the simulator to verify the result.`,
    };
  }
}

// -----------------------------------------
// MODIFY TOOL — SIMULATOR ONLY
// -----------------------------------------

export class ModifyItemTool implements NexoraTool {
  readonly name = 'modify_item';

  readonly description =
    'Requests a simulated note modification in the NEXORA Virtual Device.';

  readonly riskLevel = RiskTier.MEDIUM;

  async execute(
    parameters: Record<string, any>
  ): Promise<ToolResult> {
    const target = parameters['target'];

    const newValue =
      parameters['newValue'] ||
      parameters['content'];

    if (
      typeof target !== 'string' ||
      !target.trim()
    ) {
      return {
        success: false,
        message: 'A target is required.',
      };
    }

    if (
      typeof newValue !== 'string' ||
      !newValue.trim()
    ) {
      return {
        success: false,
        message: 'A newValue or content is required.',
      };
    }

    const screenState = deviceManager.getScreenState();

    if (!screenState?.modifyItem) {
      return {
        success: false,
        message: 'Virtual item modification is not available.',
      };
    }

    screenState.modifyItem(
      target.trim(),
      newValue.trim()
    );

    return {
      success: true,
      message: 'Virtual modification action requested. The simulator currently modifies its first note; target-specific editing is not yet implemented.',
    };
  }
}

// -----------------------------------------
// DELETE TOOL — SIMULATOR ONLY
// -----------------------------------------

export class DeleteItemTool implements NexoraTool {
  readonly name = 'delete_item';

  readonly description =
    'Requests deletion of a simulated note in the NEXORA Virtual Device.';

  readonly riskLevel = RiskTier.HIGH;

  async execute(
    parameters: Record<string, any>
  ): Promise<ToolResult> {
    const target =
      parameters['target'] ||
      parameters['id'];

    if (
      typeof target !== 'string' ||
      !target.trim()
    ) {
      return {
        success: false,
        message: 'A target or item ID is required.',
      };
    }

    const screenState = deviceManager.getScreenState();

    if (!screenState?.deleteItem) {
      return {
        success: false,
        message: 'Virtual item deletion is not available.',
      };
    }

    screenState.deleteItem(target.trim());

    return {
      success: true,
      message: 'Virtual delete action requested. The simulator currently removes its first note; target-specific deletion is not yet implemented.',
    };
  }
}

// -----------------------------------------
// ARRANGE TOOL — SIMULATOR ONLY
// -----------------------------------------

export class ArrangeItemsTool implements NexoraTool {
  readonly name = 'arrange_items';

  readonly description =
    'Rearranges simulated notes in the NEXORA Virtual Device.';

  readonly riskLevel = RiskTier.LOW;

  async execute(
    parameters: Record<string, any>
  ): Promise<ToolResult> {
    const sortBy = parameters['sortBy'] || 'latest';

    const screenState = deviceManager.getScreenState();

    if (!screenState?.arrangeItems) {
      return {
        success: false,
        message: 'Virtual item arrangement is not available.',
      };
    }

    screenState.arrangeItems(String(sortBy));

    return {
      success: true,
      message: 'Virtual arrangement action requested. Check the simulator.',
    };
  }
}
