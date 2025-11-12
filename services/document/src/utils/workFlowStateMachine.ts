import { WorkflowState } from '../models/DocumentWorkflow';

export const VALID_TRANSITIONS: Record<WorkflowState, WorkflowState[]> = {
  [WorkflowState.DRAFT]: [WorkflowState.IN_REVIEW],
  [WorkflowState.IN_REVIEW]: [
    WorkflowState.CHANGES_REQUESTED,
    WorkflowState.APPROVED,
    WorkflowState.DRAFT,
  ],
  [WorkflowState.CHANGES_REQUESTED]: [WorkflowState.IN_REVIEW, WorkflowState.DRAFT],
  [WorkflowState.APPROVED]: [WorkflowState.PUBLISHED, WorkflowState.ARCHIVED],
  [WorkflowState.PUBLISHED]: [WorkflowState.ARCHIVED],
  [WorkflowState.ARCHIVED]: [],
};

export class WorkflowStateMachine {
  static canTransition(from: WorkflowState, to: WorkflowState): boolean {
    return VALID_TRANSITIONS[from]?.includes(to) || false;
  }

  static getNextStates(currentState: WorkflowState): WorkflowState[] {
    return VALID_TRANSITIONS[currentState] || [];
  }

  static validateTransition(from: WorkflowState, to: WorkflowState): void {
    if (!this.canTransition(from, to)) {
      throw new Error(
        `Invalid state transition from ${from} to ${to}. ` +
        `Allowed transitions: ${VALID_TRANSITIONS[from]?.join(', ') || 'none'}`
      );
    }
  }
}