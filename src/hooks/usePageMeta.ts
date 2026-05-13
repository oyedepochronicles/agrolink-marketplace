import { useEffect } from "react";

const ensureMetaTag = (name: string, value: string, attr = "name") => {
  if (typeof document === "undefined") return;
  const selector = `meta[${attr}='${name}']`;
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", value);
};

const ensureLinkTag = (rel: string, href: string) => {
  if (typeof document === "undefined") return;
  let tag = document.head.querySelector<HTMLLinkElement>(`link[rel='${rel}']`);
  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute("href", href);
};

const BASE_URL =
  import.meta.env.VITE_BASE_URL || "https://agrolink-marketplace.vercel.app";
const getOrigin = () => {
  if (typeof window === "undefined") return BASE_URL;
  return BASE_URL;
};

export const resolveAbsoluteUrl = (
  value: string | undefined,
  origin: string,
) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (/^\/\//.test(value)) return `${window.location.protocol}${value}`;
  return `${origin}${value.startsWith("/") ? value : `/${value}`}`;
};

export interface PageMetaOptions {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: string;
  noIndex?: boolean;
}

export const usePageMeta = ({
  title,
  description,
  path,
  image,
  type = "website",
  noIndex = false,
}: PageMetaOptions) => {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const origin = getOrigin();
    const computedPath = path
      ? path.startsWith("http")
        ? path
        : `${path.startsWith("/") ? "" : "/"}${path}`
      : window.location.pathname;
    const url =
      path && path.startsWith("http") ? path : `${origin}${computedPath}`;
    const imageUrl = image
      ? resolveAbsoluteUrl(image, origin)
      : `${origin}/og-image.svg`;

    document.title = title;
    ensureMetaTag("description", description);
    ensureMetaTag("og:title", title, "property");
    ensureMetaTag("og:description", description, "property");
    ensureMetaTag("og:type", type, "property");
    ensureMetaTag("og:url", url, "property");
    ensureMetaTag("og:image", imageUrl, "property");
    ensureMetaTag("og:image:secure_url", imageUrl, "property");
    ensureMetaTag("twitter:title", title);
    ensureMetaTag("twitter:description", description);
    ensureMetaTag("twitter:image", imageUrl);
    ensureMetaTag("twitter:card", "summary_large_image");
    ensureMetaTag("og:site_name", "PhyhanAgro Marketplace", "property");
    ensureLinkTag("canonical", url);
    ensureMetaTag("robots", noIndex ? "noindex,follow" : "index,follow");
  }, [title, description, path, image, type, noIndex]);
};

export const useJsonLd = (data: Record<string, any> | null) => {
  useEffect(() => {
    if (typeof document === "undefined" || !data) return;
    const scriptId = "structured-data-jsonld";
    let script = document.head.querySelector<HTMLScriptElement>(
      `script#${scriptId}`,
    );
    if (!script) {
      script = document.createElement("script");
      script.setAttribute("type", "application/ld+json");
      script.setAttribute("id", scriptId);
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
    return () => {
      script?.remove();
    };
  }, [data]);
};
