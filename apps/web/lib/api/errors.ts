import type { ApiProblem } from "./types";

/** An RFC 9457 problem response from /api/v1, surfaced to the UI as one error type. */
export class ApiError extends Error {
  readonly status: number;
  readonly problem: ApiProblem;

  constructor(problem: ApiProblem) {
    super(problem.detail ?? problem.title);
    this.name = "ApiError";
    this.status = problem.status;
    this.problem = problem;
  }
}
