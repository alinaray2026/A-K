import type { ErrCode } from "./i18n.ts";

/** An error the user should see, translated from its code. */
export class AppError extends Error {
  code: ErrCode;
  vars: Record<string, string | number>;
  constructor(code: ErrCode, vars: Record<string, string | number> = {}) {
    super(code);
    this.code = code;
    this.vars = vars;
  }
}
