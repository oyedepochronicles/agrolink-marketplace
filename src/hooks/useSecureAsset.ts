import { api } from "@/lib/api";
import { useEffect, useState } from "react";

/**
 * Extract our private secure-file name from a stored identity-document URL.
 *
 * New uploads store `/api/uploads/secure/<name>`; we fetch `<name>` through the
 * authenticated secure endpoint. Anything that is a full `http(s)` URL that is
 * NOT our secure path is a legacy public document (uploaded before identity
 * scoping / pending the server migration tool) and is returned as-is to render
 * directly. Returns `null` for such legacy URLs.
 */
export const secureNameFromUrl = (url?: string | null): string | null => {
  if (!url) return null;
  const str = String(url);
  const m = str.match(/\/uploads\/secure\/([^/?#]+)/);
  if (m) return decodeURIComponent(m[1]);
  if (/^(https?:|data:|blob:)/i.test(str)) return null; // legacy / already-usable
  const seg = str.split(/[?#]/)[0].split("/").filter(Boolean).pop();
  return seg ? decodeURIComponent(seg) : null;
};

export interface SecureAsset {
  /** Object URL for a blob fetched through the authenticated secure endpoint. */
  objectUrl?: string;
  /** MIME type reported by the secure response (or the blob). */
  contentType?: string;
  /** Legacy public URL to render directly when there is no secure name. */
  publicUrl?: string;
  loading: boolean;
  error?: string;
}

/**
 * Fetch a private identity document through the authenticated
 * `GET /api/uploads/secure/:name` endpoint as a blob and expose an object URL
 * for inline rendering. The browser cannot attach the bearer token to a plain
 * `<img>`/`<a>`, so identity docs must be loaded this way. The object URL is
 * revoked on unmount / URL change.
 */
export const useSecureAsset = (url?: string | null): SecureAsset => {
  const [state, setState] = useState<SecureAsset>({ loading: false });

  useEffect(() => {
    if (!url) {
      setState({ loading: false });
      return;
    }

    const name = secureNameFromUrl(url);
    if (!name) {
      // Legacy public / already-usable URL — nothing to fetch.
      setState({ loading: false, publicUrl: String(url) });
      return;
    }

    let cancelled = false;
    let objectUrl: string | undefined;
    setState({ loading: true });

    api
      .get(`/uploads/secure/${encodeURIComponent(name)}`, {
        responseType: "blob",
      })
      .then((res) => {
        if (cancelled) return;
        const blob = res.data as Blob;
        objectUrl = URL.createObjectURL(blob);
        const headerType =
          typeof res.headers?.["content-type"] === "string"
            ? (res.headers["content-type"] as string)
            : undefined;
        setState({
          loading: false,
          objectUrl,
          contentType: blob.type || headerType,
        });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const status = (e as { response?: { status?: number } })?.response
          ?.status;
        setState({
          loading: false,
          error:
            status === 404
              ? "Document not found — it may predate secure storage."
              : status === 403
                ? "You are not authorized to view this document."
                : "Could not load document.",
        });
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  return state;
};
