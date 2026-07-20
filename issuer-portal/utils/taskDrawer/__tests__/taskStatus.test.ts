import {
  COMPLETED_STATUSES,
  SIGNED_DOCUMENT_STATUSES,
  calculateOverallCompletion,
  determineTaskStatus,
  getTaskActionButtonLabel,
  hasSignedDocumentStatus,
} from "../taskStatus";

describe("taskStatus utils", () => {
  describe("determineTaskStatus", () => {
    it("returns PENDING_AUTHORIZATION for broadridge tasks", () => {
      expect(determineTaskStatus("Submit Broadridge Form")).toBe(
        "PENDING_AUTHORIZATION"
      );
      expect(determineTaskStatus("ICS Access Request")).toBe(
        "PENDING_AUTHORIZATION"
      );
    });

    it("returns SUBMITTED_AWAITING_RECORD_DATE for transfer agent tasks", () => {
      expect(determineTaskStatus("Transfer Agent Request Form")).toBe(
        "SUBMITTED_AWAITING_RECORD_DATE"
      );
    });

    it("returns SUBMITTED_AWAITING_RECORD_DATE for plan file request tasks", () => {
      expect(determineTaskStatus("Plan File Request Form")).toBe(
        "SUBMITTED_AWAITING_RECORD_DATE"
      );
    });

    it("returns PENDING_AUTHORIZATION for proxy statement tasks", () => {
      expect(determineTaskStatus("Review Proxy Statement Draft")).toBe(
        "PENDING_AUTHORIZATION"
      );
    });

    it("returns PENDING_AUTHORIZATION as default", () => {
      expect(determineTaskStatus("Random Task")).toBe("PENDING_AUTHORIZATION");
    });
  });

  describe("hasSignedDocumentStatus", () => {
    it("returns true for PENDING_AUTHORIZATION", () => {
      expect(hasSignedDocumentStatus("PENDING_AUTHORIZATION")).toBe(true);
    });

    it("returns true for AUTHORIZED", () => {
      expect(hasSignedDocumentStatus("AUTHORIZED")).toBe(true);
    });

    it("returns true for COMPLETE", () => {
      expect(hasSignedDocumentStatus("COMPLETE")).toBe(true);
    });

    it("returns true for SUBMITTED_AWAITING_RECORD_DATE", () => {
      expect(hasSignedDocumentStatus("SUBMITTED_AWAITING_RECORD_DATE")).toBe(
        true
      );
    });

    it("returns true for WAITING_FOR_FORM_RETURN", () => {
      expect(hasSignedDocumentStatus("WAITING_FOR_FORM_RETURN")).toBe(true);
    });

    it("returns false for INCOMPLETE", () => {
      expect(hasSignedDocumentStatus("INCOMPLETE")).toBe(false);
    });

    it("returns false for NEEDS_AUTHORIZATION", () => {
      expect(hasSignedDocumentStatus("NEEDS_AUTHORIZATION")).toBe(false);
    });

    it("returns false for null or undefined", () => {
      expect(hasSignedDocumentStatus(null)).toBe(false);
      expect(hasSignedDocumentStatus(undefined)).toBe(false);
    });
  });

  describe("getTaskActionButtonLabel", () => {
    it('returns "View Form" for form tasks with signed document', () => {
      expect(getTaskActionButtonLabel("Submit Broadridge Form", true)).toBe(
        "View Form"
      );
      expect(getTaskActionButtonLabel("Plan File Request Form", true)).toBe(
        "View Form"
      );
    });

    it('returns "View Document" for non-form tasks with signed document', () => {
      expect(getTaskActionButtonLabel("Upload Supporting Document", true)).toBe(
        "View Document"
      );
    });

    it('returns "Sign Form" when no signed document exists', () => {
      expect(getTaskActionButtonLabel("Submit Broadridge Form", false)).toBe(
        "Sign Form"
      );
      expect(getTaskActionButtonLabel("Upload Document", false)).toBe(
        "Sign Form"
      );
    });
  });

  describe("calculateOverallCompletion", () => {
    it("returns 0 for empty task list", () => {
      expect(calculateOverallCompletion([])).toBe(0);
    });

    it("calculates percentage correctly", () => {
      const tasks = [
        { status: "COMPLETE" },
        { status: "INCOMPLETE" },
        { status: "AUTHORIZED" },
        { status: "PENDING_AUTHORIZATION" },
      ];
      // 3 completed out of 4 = 75%
      expect(calculateOverallCompletion(tasks)).toBe(75);
    });

    it("rounds to nearest integer", () => {
      const tasks = [
        { status: "COMPLETE" },
        { status: "INCOMPLETE" },
        { status: "INCOMPLETE" },
      ];
      // 1 out of 3 = 33.33... rounds to 33
      expect(calculateOverallCompletion(tasks)).toBe(33);
    });

    it("handles all completed tasks", () => {
      const tasks = [{ status: "COMPLETE" }, { status: "AUTHORIZED" }];
      expect(calculateOverallCompletion(tasks)).toBe(100);
    });
  });

  describe("constants", () => {
    it("COMPLETED_STATUSES includes all completion statuses", () => {
      expect(COMPLETED_STATUSES).toContain("COMPLETE");
      expect(COMPLETED_STATUSES).toContain("AUTHORIZED");
      expect(COMPLETED_STATUSES).toContain("SUBMITTED_AWAITING_RECORD_DATE");
      expect(COMPLETED_STATUSES).toContain("WAITING_FOR_FORM_RETURN");
      expect(COMPLETED_STATUSES).toContain("REQUEST_FORM_TO_FOLLOW");
      expect(COMPLETED_STATUSES).toContain("PENDING_AUTHORIZATION");
    });

    it("SIGNED_DOCUMENT_STATUSES is a subset of COMPLETED_STATUSES", () => {
      SIGNED_DOCUMENT_STATUSES.forEach((status) => {
        expect(COMPLETED_STATUSES).toContain(status);
      });
    });
  });
});
