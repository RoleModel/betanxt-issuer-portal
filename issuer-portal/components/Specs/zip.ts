/**
 * Minimal ZIP writer for downloading a set of source files as one archive.
 *
 * @remarks
 * The portal ships no zip library, and adding one so an internal spec page can
 * bundle six text files would be a poor trade. The format's stored (uncompressed)
 * variant is small enough to implement directly: a local header per file, the
 * bytes, then a central directory and an end-of-central-directory record.
 *
 * Compression is deliberately omitted. These are source files measured in
 * kilobytes downloaded over localhost or a corporate LAN — DEFLATE would add
 * far more code than it would save bytes, and every unzip tool reads stored
 * entries.
 */

/**
 * CRC-32 lookup table, built once.
 *
 * @remarks
 * The ZIP central directory stores a CRC per entry and most tools verify it, so
 * this cannot be stubbed with a zero. The table trades 1KB of memory for a
 * byte-at-a-time loop instead of a bit-at-a-time one, which matters because the
 * whole archive is checksummed on the main thread during a click handler.
 */
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);

  for (let index = 0; index < 256; index += 1) {
    let value = index;

    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) === 1 ? 0xed_b8_83_20 ^ (value >>> 1) : value >>> 1;
    }

    table[index] = value >>> 0;
  }

  return table;
})();

/**
 * Computes the CRC-32 of a byte sequence.
 *
 * @param bytes - Data to checksum.
 * @returns The unsigned 32-bit checksum.
 */
const crc32 = (bytes: Uint8Array): number => {
  let crc = 0xff_ff_ff_ff;

  for (const byte of bytes) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xff_ff_ff_ff) >>> 0;
};

export interface ZipEntry {
  /** File contents as text. Encoded UTF-8. */
  readonly contents: string;
  /** Path inside the archive, forward slashes, no leading slash. */
  readonly path: string;
}

/** Writes little-endian integers into a growing byte list. */
class ByteWriter {
  private readonly chunks: number[] = [];

  public get length(): number {
    return this.chunks.length;
  }

  public bytes(value: Uint8Array): void {
    for (const byte of value) {
      this.chunks.push(byte);
    }
  }

  /**
   * @returns The bytes written so far.
   *
   * @remarks
   * The `ArrayBuffer` type argument is explicit because the default,
   * `ArrayBufferLike`, admits `SharedArrayBuffer` — which `BlobPart` rejects.
   */
  public toUint8Array(): Uint8Array<ArrayBuffer> {
    return Uint8Array.from(this.chunks);
  }

  public uint16(value: number): void {
    this.chunks.push(value & 0xff, (value >>> 8) & 0xff);
  }

  public uint32(value: number): void {
    this.chunks.push(
      value & 0xff,
      (value >>> 8) & 0xff,
      (value >>> 16) & 0xff,
      (value >>> 24) & 0xff
    );
  }
}

/**
 * Packs text files into an uncompressed ZIP archive.
 *
 * @param entries - Files to include, each with an in-archive path.
 * @returns A Blob ready to hand to a download anchor.
 *
 * @remarks
 * Timestamps are written as a fixed value rather than the current time. The
 * archive is derived entirely from source that is checked into the repository,
 * so making the output byte-identical across downloads means two people
 * comparing what they received are comparing content rather than clock skew.
 *
 * Sizes and CRCs are written into the local header rather than a trailing data
 * descriptor, which is legal because the contents are fully known before the
 * header is emitted — and it keeps the archive readable by the strictest tools.
 */
export const createZipBlob = (entries: readonly ZipEntry[]): Blob => {
  const encoder = new TextEncoder();
  const output = new ByteWriter();
  const directory = new ByteWriter();
  // 1980-01-01 00:00, the earliest timestamp the DOS date format can express.
  const dosTime = 0;
  const dosDate = 0x21;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.path);
    const dataBytes = encoder.encode(entry.contents);
    const checksum = crc32(dataBytes);
    const localHeaderOffset = output.length;

    output.uint32(0x04_03_4b_50); // Local file header signature
    output.uint16(20); // Version needed to extract
    output.uint16(0x8_00); // Flags: UTF-8 filenames
    output.uint16(0); // Method: stored
    output.uint16(dosTime);
    output.uint16(dosDate);
    output.uint32(checksum);
    output.uint32(dataBytes.length);
    output.uint32(dataBytes.length);
    output.uint16(nameBytes.length);
    output.uint16(0); // Extra field length
    output.bytes(nameBytes);
    output.bytes(dataBytes);

    directory.uint32(0x02_01_4b_50); // Central directory header signature
    directory.uint16(20); // Version made by
    directory.uint16(20); // Version needed to extract
    directory.uint16(0x8_00);
    directory.uint16(0);
    directory.uint16(dosTime);
    directory.uint16(dosDate);
    directory.uint32(checksum);
    directory.uint32(dataBytes.length);
    directory.uint32(dataBytes.length);
    directory.uint16(nameBytes.length);
    directory.uint16(0); // Extra field length
    directory.uint16(0); // Comment length
    directory.uint16(0); // Disk number start
    directory.uint16(0); // Internal attributes
    directory.uint32(0); // External attributes
    directory.uint32(localHeaderOffset);
    directory.bytes(nameBytes);
  }

  const directoryOffset = output.length;
  const directoryBytes = directory.toUint8Array();

  output.bytes(directoryBytes);
  output.uint32(0x06_05_4b_50); // End of central directory signature
  output.uint16(0); // Disk number
  output.uint16(0); // Disk with central directory
  output.uint16(entries.length);
  output.uint16(entries.length);
  output.uint32(directoryBytes.length);
  output.uint32(directoryOffset);
  output.uint16(0); // Comment length

  return new Blob([output.toUint8Array()], { type: "application/zip" });
};

/**
 * Hands the browser a generated archive.
 *
 * @param filename - Name to save under, `.zip` included.
 * @param entries - Files to pack.
 */
export const downloadZip = (
  filename: string,
  entries: readonly ZipEntry[]
): void => {
  const url = URL.createObjectURL(createZipBlob(entries));
  const anchor = document.createElement("a");

  anchor.download = filename;
  anchor.href = url;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  globalThis.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
};
