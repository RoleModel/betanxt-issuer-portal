/**
 * Client-side file downloads for the spec page.
 *
 * @remarks
 * The spec is static content compiled into the bundle, so there is nothing for
 * a server route to serve — a Blob URL keeps the whole feature client-only and
 * avoids adding an API surface that would then need auth rules of its own.
 */

/**
 * Hands the browser a file built from an in-memory string.
 *
 * @param filename - Name the browser should save under, extension included.
 * @param contents - Exact bytes of the file.
 * @param mimeType - Defaults to Markdown, which is what most of the package is.
 *
 * @remarks
 * The object URL is revoked on the next tick rather than immediately: Safari
 * cancels an in-flight download when the URL is revoked in the same frame as
 * the synthetic click, and a zero-delay timeout is the cheapest fix that keeps
 * the memory from leaking.
 */
export const downloadTextFile = (
  filename: string,
  contents: string,
  mimeType = "text/markdown;charset=utf-8"
): void => {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
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
