import { copycat } from "@snaplet/copycat";
import csvParser from "csv-parser";
import { createReadStream } from "fs";

type CsvRow = Record<string, string>;

const isObject = (val: unknown): val is Record<string, unknown> =>
  typeof val === "object" && val !== null;

const isPositionRow = (row: unknown): row is CsvRow => {
  if (!isObject(row)) return false;
  // minimally ensure expected keys exist as strings (or can be coerced)
  const keys = ["Cusip", "Account Type", "Set Key", "Name", "Shares", "Shares Voted"];
  return keys.every((k) => k in row);
};

const isTabulationRow = (row: unknown): row is CsvRow => {
  if (!isObject(row)) return false;
  const keys = ["Proposal", "MRV", "For", "Against", "Abstain", "Total"];
  return keys.every((k) => k in row);
};

export interface WendysPositionData {
  cusip: string;
  accountType: string;
  setKey: string;
  name: string;
  accountNumber: string | null;
  voteStatus: string;
  shares: number;
  sharesVoted: number;
  source: string | null;
  dateVoted: Date | null;
}

export interface WendysTabulationData {
  proposal: string;
  mrv: string;
  for: number;
  against: number;
  abstain: number;
  total: number;
}

export interface CompanyMeetingInfo {
  company: string;
  cusip: string;
  meetingType: string;
  recordDate: string;
  meetingDate: string;
  cutoffDate?: string;
}

export interface CompanyProposalData {
  number: string;
  title: string;
  type: string;
  subtype: string | null;
  recommendation: string;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  votesTotal: number;
}

export interface CompanyPositionData {
  cusip: string;
  setKey?: string | null;
  accountType: string;
  name: string;
  accountNumber: string | null;
  voteStatus: "Voted" | "Unvoted";
  shares: number;
  sharesVoted: number;
  source: string | null;
  dateVoted: Date | null;
  voteMethod?: string;
  controlNumber?: string;
}

export class CSVProcessor {
  /**
   * Normalize account types for tabulation report compatibility
   */
  private static normalizeAccountType(rawAccountType: string): string {
    const type = rawAccountType.toUpperCase();
    if (
      type.includes("CEDE") ||
      type.includes("CDS") ||
      type.includes("CTC") ||
      type.includes("DTC")
    ) {
      return "DTC/CDS";
    }
    // Everything else is considered Non-DTC (registered accounts, etc.)
    return "Non-DTC";
  }

  /**
   * Process Wendy's shareholder votes CSV data
   */
  static async processWendysVotes(filePath: string): Promise<WendysPositionData[]> {
    const positions: WendysPositionData[] = [];

    return new Promise((resolve, reject) => {
      createReadStream(filePath)
        .pipe(csvParser({ headers: true }))
        .on("data", (row: unknown) => {
          try {
            if (!isPositionRow(row)) {
              return;
            }
            positions.push({
              cusip: row.Cusip ?? "",
              accountType: this.normalizeAccountType(row["Account Type"] ?? ""),
              setKey: row["Set Key"] ?? "",
              name: row.Name ?? "",
              accountNumber: row["Account #"] || null,
              voteStatus: row["Vote Status"] || "Unvoted",
              shares: this.parseNumber(row.Shares),
              sharesVoted: this.parseNumber(row["Shares Voted"]),
              source: row.Source || null,
              dateVoted: this.parseDate(row["Date Voted"]),
            });
          } catch {
            // Ignore malformed row; continue processing stream
          }
        })
        .on("end", () => {
          resolve(positions);
        })
        .on("error", reject);
    });
  }

  /**
   * Process Wendy's tabulation data CSV
   */
  static async processWendysTabulation(filePath: string): Promise<WendysTabulationData[]> {
    const tabulation: WendysTabulationData[] = [];

    return new Promise((resolve, reject) => {
      createReadStream(filePath)
        .pipe(csvParser({ headers: true }))
        .on("data", (row: unknown) => {
          try {
            if (!isTabulationRow(row)) {
              return;
            }
            tabulation.push({
              proposal: row.Proposal ?? "",
              mrv: row.MRV ?? "",
              for: this.parseNumber(row.For),
              against: this.parseNumber(row.Against),
              abstain: this.parseNumber(row.Abstain),
              total: this.parseNumber(row.Total),
            });
          } catch {
            // Ignore malformed row; continue processing stream
          }
        })
        .on("end", () => {
          resolve(tabulation);
        })
        .on("error", reject);
    });
  }

  /**
   * Generate realistic position data for other companies based on Wendy's patterns
   */
  static generateCompanyPositions(
    company: { ticker: string; cusip: string; totalSharesOutstanding: number },
    wendysPattern: WendysPositionData[],
    targetCount = 2500,
  ): Omit<WendysPositionData, "cusip" | "setKey">[] {
    const positions: Omit<WendysPositionData, "cusip" | "setKey">[] = [];

    // Calculate scaling factor based on shares outstanding
    const wendysTotal = 176618508; // From CSV data
    const scaleFactor = company.totalSharesOutstanding / wendysTotal;

    // Sample positions from Wendy's pattern and scale
    for (let i = 0; i < targetCount; i++) {
      const sampleIndex = i % wendysPattern.length;
      const sample = wendysPattern[sampleIndex];

      const scaledShares = Math.floor(sample.shares * scaleFactor);
      const scaledVoted = Math.floor(sample.sharesVoted * scaleFactor);

      positions.push({
        accountType: sample.accountType,
        name: copycat.fullName(`${company.ticker}-position-${i}`),
        accountNumber: copycat
          .int(`${company.ticker}-account-${i}`, { min: 100000, max: 999999 })
          .toString(),
        voteStatus: copycat.oneOf(`${company.ticker}-vote-status-${i}`, ["Voted", "Unvoted"]),
        shares: scaledShares,
        sharesVoted: scaledVoted,
        source: sample.source,
        dateVoted: sample.dateVoted,
      });
    }

    return positions;
  }

  /**
   * Parse number from CSV string (handles commas and empty values)
   */
  private static parseNumber(value: string): number {
    if (!value || value.trim() === "") return 0;
    const cleaned = value.replace(/,/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  private static inferProposalType(
    title: string,
    proposalNumber: string,
  ): { type: string; subtype: string | null } {
    const normalized = title.toLowerCase();
    const number = proposalNumber.trim();

    if (number.startsWith("1.") || normalized.includes("director")) {
      return { type: "Director Election", subtype: "Individual" };
    }

    if (/auditor|accounting firm|ratification/.test(normalized)) {
      return { type: "Auditor Ratification", subtype: null };
    }

    if (normalized.includes("frequency") && /compensation|say on pay/.test(normalized)) {
      return { type: "Say on Pay Frequency", subtype: null };
    }

    if (normalized.includes("executive compensation") || normalized.includes("say on pay")) {
      return { type: "Say on Pay", subtype: null };
    }

    if (/shareholder|stockholder/.test(normalized)) {
      return { type: "Shareholder Proposal", subtype: null };
    }

    if (normalized.includes("bylaw") || normalized.includes("charter")) {
      return { type: "Governance Proposal", subtype: null };
    }

    return { type: "Other", subtype: null };
  }

  /**
   * Parse date from CSV string
   */
  private static parseDate(value: string): Date | null {
    if (!value || value.trim() === "") return null;
    try {
      return new Date(value);
    } catch {
      return null;
    }
  }

  /**
   * Process company meeting info CSV
   */
  static async processCompanyMeetingInfo(filePath: string): Promise<CompanyMeetingInfo | null> {
    return new Promise((resolve, reject) => {
      let meetingInfo: CompanyMeetingInfo | null = null;
      let isFirstRow = true;

      createReadStream(filePath)
        .pipe(csvParser({ headers: true }))
        .on("data", (row: Record<string, string>) => {
          if (isFirstRow) {
            meetingInfo = {
              company: (row.Company || row.Issuer) ?? "",
              cusip: (row.CUSIP || row.Cusip) ?? "",
              meetingType: row["Meeting Type"] || "Annual Meeting",
              recordDate: row["Record Date"] ?? "",
              meetingDate: row["Meeting Date"] ?? "",
              cutoffDate: row["Cutoff Date"] || row["Cut Off Date"] || undefined,
            };
            isFirstRow = false;
          }
        })
        .on("end", () => {
          resolve(meetingInfo);
        })
        .on("error", reject);
    });
  }

  /**
   * Process company proposal CSV
   */
  static async processCompanyProposals(filePath: string): Promise<CompanyProposalData[]> {
    const proposals: CompanyProposalData[] = [];

    return new Promise((resolve, reject) => {
      createReadStream(filePath)
        .pipe(csvParser())
        .on("data", (row: Record<string, string>) => {
          try {
            const proposalColumn =
              (row["Proposal Number"] || row.Proposal || row.Prop || row["Proposal Item"]) ?? "";
            const rawProposal = proposalColumn.trim();
            const match = /^(\d+(?:\.\d+)?)\s*(.*)$/.exec(rawProposal);
            const number = match ? match[1] : `${proposals.length + 1}`;
            const fallbackTitle = match?.[2] || proposalColumn.trim();
            const title = (
              (row["Proposal Title"] || row.Description || fallbackTitle) ??
              ""
            ).trim();

            const recommendation = (
              (row.MRV || row["Management Recommendation"] || row.Recommendation) ??
              "FOR"
            )
              .toString()
              .trim();

            const votesFor = this.parseNumber(
              row.For || row["Votes For"] || row["For Votes"] || "0",
            );
            const votesAgainst = this.parseNumber(
              row.Against || row["Votes Against"] || row["Against Votes"] || "0",
            );
            const votesAbstain = this.parseNumber(
              row.Abstain || row.Abstentions || row["Votes Abstain"] || "0",
            );
            const totalRaw = (row.Total || row["Votes Total"] || row["Total Votes"]) ?? "";
            const votesTotal = totalRaw
              ? this.parseNumber(totalRaw)
              : votesFor + votesAgainst + votesAbstain;

            const { type, subtype } = this.inferProposalType(title, number);

            proposals.push({
              number,
              title,
              type,
              subtype,
              recommendation: recommendation.toUpperCase() || "FOR",
              votesFor,
              votesAgainst,
              votesAbstain,
              votesTotal,
            });
          } catch {
            // Ignore malformed rows
          }
        })
        .on("end", () => resolve(proposals))
        .on("error", reject);
    });
  }

  /**
   * Process generic company position data CSV
   */
  static async processCompanyPositions(
    filePath: string,
    cusip: string,
    limit?: number,
  ): Promise<CompanyPositionData[]> {
    const positions: CompanyPositionData[] = [];
    let rowCount = 0;
    let _totalRows = 0; // unused tally retained for possible future diagnostics

    return new Promise((resolve, reject) => {
      let headers: string[] = [];
      let isFirstRow = true;

      createReadStream(filePath)
        .pipe(csvParser({ headers: false }))
        .on("data", (row: Record<string, unknown>) => {
          if (isFirstRow) {
            // Parse headers manually, filtering out empty columns
            headers = Object.values(row)
              .map((h: unknown) => String(h).trim())
              .filter((h) => h !== "");
            isFirstRow = false;
            return;
          }

          _totalRows++;

          // Convert array row to object using our headers
          const rowObj: Record<string, string> = {};
          let headerIndex = 0;
          Object.values(row).forEach((val: unknown, idx: number) => {
            // Skip empty header positions
            if (Object.values(row)[idx] !== "") {
              if (headers[headerIndex]) {
                rowObj[headers[headerIndex]] = String(val).trim();
              }
              headerIndex++;
            }
          });

          if (limit && rowCount >= limit) return;

          // Skip if no shares
          const shares = this.parseNumber(
            (rowObj.Shares || rowObj["Share Count"] || rowObj.Holdings) ?? "0",
          );
          if (shares === 0) return;

          const rawStatus = ((rowObj.Status || rowObj["Vote Status"]) ?? "").toString().trim();
          const normalisedStatus = rawStatus.toLowerCase() === "voted" ? "Voted" : "Unvoted";

          const sharesVoted = this.parseNumber(
            rowObj["Shares Voted"] || rowObj["Voted Shares"] || "0",
          );

          positions.push({
            cusip: cusip,
            setKey: rowObj["Set Key"] || rowObj.SetKey || null,
            accountType: this.normalizeAccountType(
              (rowObj["Account Type"] || rowObj.Type) ?? "Registered Account",
            ),
            name:
              (rowObj.Account || rowObj["Account Name"] || rowObj.Name || rowObj.Shareholder) ??
              "Unknown",
            accountNumber: rowObj["Account#"] || rowObj["Account Number"] || rowObj.Account || null,
            voteStatus: normalisedStatus,
            shares: shares,
            sharesVoted: sharesVoted,
            source: rowObj.Source || rowObj["Vote Method"] || null,
            dateVoted: this.parseDate(
              (rowObj["Time Stamp"] || rowObj["Vote Date"] || rowObj["Voted Date"]) ?? "",
            ),
            voteMethod: rowObj["Vote Method"] || rowObj.Method || rowObj.Source || undefined,
            controlNumber: rowObj["Control Number"] || rowObj.Control || undefined,
          });
          rowCount++;
        })
        .on("end", () => {
          resolve(positions);
        })
        .on("error", reject);
    });
  }

  /**
   * Process vote status summary CSV files (e.g., wendys_dtc_vote_status.csv, wendys_non_dtc_vote_status.csv)
   */
  static async processVoteStatusSummary(
    dtcFilePath: string,
    nonDtcFilePath: string,
  ): Promise<{
    dtcSummary: {
      unvotedParticipants: number;
      unvotedShares: number;
      votedParticipants: number;
      votedShares: number;
    };
    nonDtcSummary: {
      unvotedShareholders: number;
      unvotedShares: number;
      printShareholders: number;
      printShares: number;
      ivrShareholders: number;
      ivrShares: number;
      webShareholders: number;
      webShares: number;
      votedSubtotalShareholders: number;
      votedSubtotalShares: number;
      grandTotalShareholders: number;
      grandTotalShares: number;
    };
  }> {
    interface DtcSummaryData {
      unvotedParticipants: number;
      unvotedShares: number;
      votedParticipants: number;
      votedShares: number;
    }

    // Process DTC summary file
    const dtcSummary = await new Promise<DtcSummaryData>((resolve, reject) => {
      const results: DtcSummaryData = {
        unvotedParticipants: 0,
        unvotedShares: 0,
        votedParticipants: 0,
        votedShares: 0,
      };

      createReadStream(dtcFilePath)
        .pipe(csvParser())
        .on("data", (row) => {
          const category = (row.Category ?? "").toLowerCase();
          const participants = this.parseNumber(row.Participants ?? "0");
          const shares = this.parseNumber(row.Shares ?? "0");

          if (category.includes("unvoted")) {
            results.unvotedParticipants = participants;
            results.unvotedShares = shares;
          } else if (category.includes("voted")) {
            results.votedParticipants = participants;
            results.votedShares = shares;
          }
        })
        .on("end", () => resolve(results))
        .on("error", reject);
    });

    interface NonDtcSummaryData {
      unvotedShareholders: number;
      unvotedShares: number;
      printShareholders: number;
      printShares: number;
      ivrShareholders: number;
      ivrShares: number;
      webShareholders: number;
      webShares: number;
      votedSubtotalShareholders: number;
      votedSubtotalShares: number;
      grandTotalShareholders: number;
      grandTotalShares: number;
    }

    // Process Non-DTC summary file
    const nonDtcSummary = await new Promise<NonDtcSummaryData>((resolve, reject) => {
      const results: NonDtcSummaryData = {
        unvotedShareholders: 0,
        unvotedShares: 0,
        printShareholders: 0,
        printShares: 0,
        ivrShareholders: 0,
        ivrShares: 0,
        webShareholders: 0,
        webShares: 0,
        votedSubtotalShareholders: 0,
        votedSubtotalShares: 0,
        grandTotalShareholders: 0,
        grandTotalShares: 0,
      };

      createReadStream(nonDtcFilePath)
        .pipe(csvParser())
        .on("data", (row) => {
          const category = (row.Category ?? "").toLowerCase();
          const shareholders = this.parseNumber(row.Shareholders ?? "0");
          const shares = this.parseNumber(row.Shares ?? "0");

          if (category.includes("unvoted")) {
            results.unvotedShareholders = shareholders;
            results.unvotedShares = shares;
          } else if (category === "print") {
            results.printShareholders = shareholders;
            results.printShares = shares;
          } else if (category === "ivr") {
            results.ivrShareholders = shareholders;
            results.ivrShares = shares;
          } else if (category === "web") {
            results.webShareholders = shareholders;
            results.webShares = shares;
          } else if (category.includes("voted sub-total")) {
            results.votedSubtotalShareholders = shareholders;
            results.votedSubtotalShares = shares;
          } else if (category.includes("grand total")) {
            results.grandTotalShareholders = shareholders;
            results.grandTotalShares = shares;
          }
        })
        .on("end", () => resolve(results))
        .on("error", reject);
    });

    return { dtcSummary, nonDtcSummary };
  }
}
