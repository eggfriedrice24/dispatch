import type { GhWorkflow, GhWorkflowRun, GhWorkflowRunDetail } from "../../ipc";

export interface WorkflowIpcApi {
  "workflows.list": { args: { cwd: string }; result: GhWorkflow[] };
  "workflows.runs": {
    args: { cwd: string; workflowId?: number; limit?: number };
    result: GhWorkflowRun[];
  };
  "workflows.runDetail": { args: { cwd: string; runId: number }; result: GhWorkflowRunDetail };
  "workflows.trigger": {
    args: { cwd: string; workflowId: string; ref: string; inputs?: Record<string, string> };
    result: void;
  };
  "workflows.cancel": { args: { cwd: string; runId: number }; result: void };
  "workflows.rerunAll": { args: { cwd: string; runId: number }; result: void };
  "workflows.yaml": { args: { cwd: string; workflowId: string }; result: string };
}
