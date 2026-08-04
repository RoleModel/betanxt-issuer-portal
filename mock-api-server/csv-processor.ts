/* eslint-disable sonarjs/super-linear-regex */
/* eslint-disable prefer-named-capture-group */
/* eslint-disable @typescript-eslint/no-extraneous-class */
/* eslint-disable unicorn/no-for-each */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable sonarjs/expression-complexity */
/* eslint-disable unicorn/no-computed-property-existence-check */
/* eslint-disable github/array-foreach */
/* eslint-disable no-plusplus */
/* eslint-disable unicorn/no-unused-properties */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable unicorn/try-complexity */
/* eslint-disable compat/compat */
/* eslint-disable promise/avoid-new */
/* eslint-disable @typescript-eslint/member-ordering */
import { createReadStream } from "node:fs";
import { copycat } from "@snaplet/copycat";
import csvParser from "csv-parser";

type CsvRow = Record<string, string>;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isPositionRow = (row: unknown): row is CsvRow => {
  if (!isObject(row)) {
    return false;
  }
  // minimally ensure expected keys exist as strings (or can be coerced)
  const keys = [
    "Cusip",
    "Account Type",
    "Set Key",
    "Name",
    "Shares",
    "Shares Voted",
  ];
  return keys.every((k) => Object.hasOwn(row, k));
};

const isTabulationRow = (row: unknown): row is CsvRow => {
  if (!isObject(row)) {
    return false;
  }
  const keys = ["Proposal", "MRV", "For", "Against", "Abstain", "Total"];
  return keys.every((k) => Object.hasOwn(row, k));
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
  static async processWendysVotes(
    filePath: string
  ): Promise<WendysPositionData[]> {
    const positions: WendysPositionData[] = [];

    return await new Promise((resolve, reject) => {
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
  static async processWendysTabulation(
    filePath: string
  ): Promise<WendysTabulationData[]> {
    const tabulation: WendysTabulationData[] = [];

    return await new Promise((resolve, reject) => {
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
    targetCount = 2500
  ): Omit<WendysPositionData, "cusip" | "setKey">[] {
    const positions: Omit<WendysPositionData, "cusip" | "setKey">[] = [];

    // Calculate scaling factor based on shares outstanding
    const wendysTotal = 176_618_508;
    const scaleFactor = company.totalSharesOutstanding / wendysTotal;

    // Sample positions from Wendy's pattern and scale
    for (let index = 0; index < targetCount; index++) {
      const sampleIndex = index % wendysPattern.length;
      const sample = wendysPattern[sampleIndex];

      const scaledShares = Math.floor(sample.shares * scaleFactor);
      const scaledVoted = Math.floor(sample.sharesVoted * scaleFactor);

      positions.push({
        accountType: sample.accountType,
        name: copycat.fullName(`${company.ticker}-position-${index}`),
        accountNumber: copycat
          .int(`${company.ticker}-account-${index}`, {
            min: 100_000,
            max: 999_999,
          })
          .toString(),
        voteStatus: copycat.oneOf(`${company.ticker}-vote-status-${index}`, [
          "Voted",
          "Unvoted",
        ]),
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
    if (!value || value.trim() === "") {
      return 0;
    }
    const cleaned = value.replaceAll(",", "");
    const parsed = Number(cleaned);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private static inferProposalType(
    title: string,
    proposalNumber: string
  ): { type: string; subtype: string | null } {
    const normalized = title.toLowerCase();
    const number = proposalNumber.trim();

    if (number.startsWith("1.") || normalized.includes("director")) {
      return { type: "Director Election", subtype: "Individual" };
    }

    if (/auditor|accounting firm|ratification/u.test(normalized)) {
      return { type: "Auditor Ratification", subtype: null };
    }

    if (
      normalized.includes("frequency") &&
      /compensation|say on pay/u.test(normalized)
    ) {
      return { type: "Say on Pay Frequency", subtype: null };
    }

    if (
      normalized.includes("executive compensation") ||
      normalized.includes("say on pay")
    ) {
      return { type: "Say on Pay", subtype: null };
    }

    if (/shareholder|stockholder/u.test(normalized)) {
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
    if (!value || value.trim() === "") {
      return null;
    }
    try {
      return new Date(value);
    } catch {
      return null;
    }
  }

  /**
   * Process company meeting info CSV
   */
  static async processCompanyMeetingInfo(
    filePath: string
  ): Promise<CompanyMeetingInfo | null> {
    return await new Promise((resolve, reject) => {
      let meetingInfo: CompanyMeetingInfo | null = null;
      let isFirstRow = true;

      createReadStream(filePath)
        .pipe(csvParser({ headers: true }))
        .on("data", (row: Record<string, string>) => {
          if (!isFirstRow) {
            return;
          }

          meetingInfo = {
            company: (row.Company || row.Issuer) ?? "",
            cusip: (row.CUSIP || row.Cusip) ?? "",
            meetingType: row["Meeting Type"] || "Annual Meeting",
            recordDate: row["Record Date"] ?? "",
            meetingDate: row["Meeting Date"] ?? "",
            cutoffDate: row["Cutoff Date"] || row["Cut Off Date"] || undefined,
          };
          isFirstRow = false;
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
  static async processCompanyProposals(
    filePath: string
  ): Promise<CompanyProposalData[]> {
    const proposals: CompanyProposalData[] = [];

    return await new Promise((resolve, reject) => {
      createReadStream(filePath)
        .pipe(csvParser())
        .on("data", (row: Record<string, string>) => {
          try {
            const proposalColumn =
              (row["Proposal Number"] ||
                row.Proposal ||
                row.Prop ||
                row["Proposal Item"]) ??
              "";
            const rawProposal = proposalColumn.trim();
            const match = /^(\d+(?:\.\d+)?)\s*(?:.*)$/u.exec(rawProposal);
            // eslint-disable-next-line unicorn/no-useless-template-literals
            const number = match ? match[1] : `${proposals.length + 1}`;
            const fallbackTitle = match?.[2] || proposalColumn.trim();
            const title = (
              (row["Proposal Title"] || row.Description || fallbackTitle) ??
              ""
            ).trim();

            const recommendation = (
              (row.MRV ||
                row["Management Recommendation"] ||
                row.Recommendation) ??
              "FOR"
            ).trim();

            const votesFor = this.parseNumber(
              row.For || row["Votes For"] || row["For Votes"] || "0"
            );
            const votesAgainst = this.parseNumber(
              row.Against || row["Votes Against"] || row["Against Votes"] || "0"
            );
            const votesAbstain = this.parseNumber(
              row.Abstain || row.Abstentions || row["Votes Abstain"] || "0"
            );
            const totalRaw =
              (row.Total || row["Votes Total"] || row["Total Votes"]) ?? "";
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
        .on("end", () => {
          resolve(proposals);
        })
        .on("error", reject);
    });
  }

  /**
   * Process generic company position data CSV
   */
  static async processCompanyPositions(
    filePath: string,
    cusip: string,
    limit?: number
  ): Promise<CompanyPositionData[]> {
    const positions: CompanyPositionData[] = [];
    let rowCount = 0;
    let _totalRows = 0;
    return await new Promise((resolve, reject) => {
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
          const rowObject: Record<string, string> = {};
          let headerIndex = 0;
          Object.values(row).forEach((value: unknown, index: number) => {
            // Skip empty header positions
            if (Object.values(row)[index] === "") {
              return;
            }

            if (headers[headerIndex]) {
              rowObject[headers[headerIndex]] = String(value).trim();
            }
            headerIndex++;
          });

          if (limit && rowCount >= limit) {
            return;
          }

          // Skip if no shares
          const shares = this.parseNumber(
            (rowObject.Shares ||
              rowObject["Share Count"] ||
              rowObject.Holdings) ??
              "0"
          );
          if (shares === 0) {
            return;
          }

          const rawStatus = (
            (rowObject.Status || rowObject["Vote Status"]) ??
            ""
          ).trim();
          const normalisedStatus =
            rawStatus.toLowerCase() === "voted" ? "Voted" : "Unvoted";

          const sharesVoted = this.parseNumber(
            rowObject["Shares Voted"] || rowObject["Voted Shares"] || "0"
          );

          positions.push({
            cusip,
            setKey: rowObject["Set Key"] || rowObject.SetKey || null,
            accountType: this.normalizeAccountType(
              (rowObject["Account Type"] || rowObject.Type) ??
                "Registered Account"
            ),
            name:
              (rowObject.Account ||
                rowObject["Account Name"] ||
                rowObject.Name ||
                rowObject.Shareholder) ??
              "Unknown",
            accountNumber:
              rowObject["Account#"] ||
              rowObject["Account Number"] ||
              rowObject.Account ||
              null,
            voteStatus: normalisedStatus,
            shares,
            sharesVoted,
            source: rowObject.Source || rowObject["Vote Method"] || null,
            dateVoted: this.parseDate(
              (rowObject["Time Stamp"] ||
                rowObject["Vote Date"] ||
                rowObject["Voted Date"]) ??
                ""
            ),
            voteMethod:
              rowObject["Vote Method"] ||
              rowObject.Method ||
              rowObject.Source ||
              undefined,
            controlNumber:
              rowObject["Control Number"] || rowObject.Control || undefined,
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
    nonDtcFilePath: string
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
      solicitorShareholders: number;
      solicitorShares: number;
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
        .on("end", () => {
          resolve(results);
        })
        .on("error", reject);
    });

    interface NonDtcSummaryData {
      unvotedShareholders: number;
      unvotedShares: number;
      printShareholders: number;
      printShares: number;
      ivrShareholders: number;
      ivrShares: number;
      solicitorShareholders: number;
      solicitorShares: number;
      webShareholders: number;
      webShares: number;
      votedSubtotalShareholders: number;
      votedSubtotalShares: number;
      grandTotalShareholders: number;
      grandTotalShares: number;
    }

    // Process Non-DTC summary file
    const nonDtcSummary = await new Promise<NonDtcSummaryData>(
      (resolve, reject) => {
        const results: NonDtcSummaryData = {
          unvotedShareholders: 0,
          unvotedShares: 0,
          printShareholders: 0,
          printShares: 0,
          ivrShareholders: 0,
          ivrShares: 0,
          solicitorShareholders: 12,
          solicitorShares: 12,
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
            } else {
              switch (category) {
                case "print": {
                  results.printShareholders = shareholders;
                  results.printShares = shares;

                  break;
                }
                case "ivr": {
                  results.ivrShareholders = shareholders;
                  results.ivrShares = shares;

                  break;
                }
                case "web": {
                  results.webShareholders = shareholders;
                  results.webShares = shares;

                  break;
                }
                case "solicitor": {
                  results.solicitorShareholders = shareholders;
                  results.solicitorShares = shares;

                  break;
                }
                default: {
                  if (category.includes("voted sub-total")) {
                    results.votedSubtotalShareholders = shareholders;
                    results.votedSubtotalShares = shares;
                  } else if (category.includes("grand total")) {
                    results.grandTotalShareholders = shareholders;
                    results.grandTotalShares = shares;
                  }
                }
              }
            }
          })
          .on("end", () => {
            resolve(results);
          })
          .on("error", reject);
      }
    );

    return { dtcSummary, nonDtcSummary };
  }
}
