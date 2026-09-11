import { Button } from "@/components/ui/button";
import { useSecureAsset } from "@/hooks/useSecureAsset";
import {
  AlertCircle,
  Download,
  ExternalLink,
  FileText,
  Loader2,
} from "lucide-react";

const looksLikePdf = (type?: string, hint?: string) =>
  (!!type && type.includes("pdf")) || /\.pdf($|[?#])/i.test(hint || "");
const looksLikeImage = (type?: string, hint?: string) =>
  (!!type && type.startsWith("image/")) ||
  /\.(png|jpe?g|webp|gif|bmp|heic|heif)($|[?#])/i.test(hint || "");

/**
 * Render a KYC / identity document securely.
 *
 * The document is fetched through the authenticated secure endpoint as a blob
 * (see {@link useSecureAsset}); it is never linked with a plain `<a href>` that
 * would hit the server without the bearer token. Images render inline, PDFs in
 * an iframe, and anything else gets a download action. Legacy public URLs (from
 * before identity scoping) are rendered directly.
 */
export const SecureDocument = ({
  label,
  url,
  className = "",
}: {
  label: string;
  url?: string | null;
  className?: string;
}) => {
  const { objectUrl, publicUrl, contentType, loading, error } =
    useSecureAsset(url);
  const src = objectUrl || publicUrl;
  const hint = url || publicUrl || undefined;

  return (
    <div
      className={`overflow-hidden rounded-xl border border-border bg-background ${className}`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border bg-secondary/40 px-3 py-2">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <FileText className="h-4 w-4 text-muted-foreground" />
          {label}
        </span>
        {src && (
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open
          </a>
        )}
      </div>

      <div className="flex min-h-[9rem] items-center justify-center p-3">
        {!url ? (
          <p className="text-sm text-muted-foreground">Not provided</p>
        ) : loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : error ? (
          <p className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" /> {error}
          </p>
        ) : !src ? (
          <p className="text-sm text-muted-foreground">Unavailable</p>
        ) : looksLikeImage(contentType, hint) ? (
          <img
            src={src}
            alt={label}
            className="max-h-80 w-auto rounded-lg object-contain"
          />
        ) : looksLikePdf(contentType, hint) ? (
          <iframe
            src={src}
            title={label}
            className="h-96 w-full rounded-lg border-0"
          />
        ) : (
          <Button variant="outline" size="sm" asChild>
            <a href={src} download target="_blank" rel="noreferrer">
              <Download className="h-4 w-4" /> Download document
            </a>
          </Button>
        )}
      </div>
    </div>
  );
};

export default SecureDocument;
