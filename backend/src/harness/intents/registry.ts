import type { AnyIntentHandler } from './types';
import { planMessages } from './planMessages';
import { extractKnowledge } from './extractKnowledge';
import { generalChat } from './generalChat';

/**
 * Registration order is priority order: the orchestrator tries each handler's
 * detect() in turn and the first match wins. generalChat is the catch-all and
 * must stay last.
 *
 * Adding a new intent (e.g. a keyword trigger) = add a handler file and one
 * entry here. The orchestrator does not change.
 */
export const intentRegistry: AnyIntentHandler[] = [planMessages, extractKnowledge, generalChat];

export type { AnyIntentHandler } from './types';
