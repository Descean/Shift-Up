/**
 * Corps d'un article de blog.
 *  - Articles rédigés dans l'admin (éditeur TipTap) : HTML, nettoyé par sanitize-html
 *    (balises et attributs autorisés uniquement, liens externes en noopener).
 *  - Articles importés en Markdown : rendus par react-markdown (+ tableaux GFM).
 * La mise en forme est commune (classe .article-body dans globals.css).
 */
import sanitizeHtml from "sanitize-html";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const RE_HTML = /<\/?(p|h[1-6]|ul|ol|li|strong|em|b|i|u|a|br|blockquote|table|img|div|span|pre|code)\b[^>]*>/i;

export function estHtml(contenu: string) {
  return RE_HTML.test(contenu);
}

export function nettoyerHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: ["h2", "h3", "h4", "p", "br", "hr", "strong", "b", "em", "i", "u", "s", "a", "ul", "ol", "li", "blockquote", "pre", "code",
      "table", "thead", "tbody", "tr", "th", "td", "img", "figure", "figcaption", "span", "mark"],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      th: ["colspan", "rowspan", "style"], td: ["colspan", "rowspan", "style"],
      p: ["style"], h2: ["style"], h3: ["style"], h4: ["style"],
    },
    allowedStyles: { "*": { "text-align": [/^(left|right|center|justify)$/] } },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["https", "data"] },
    transformTags: {
      h1: "h2",
      a: (tagName, attribs) => {
        const externe = /^https?:\/\//i.test(attribs.href ?? "") && !/^https?:\/\/(www\.)?shiftup\.bj/i.test(attribs.href ?? "");
        return { tagName, attribs: externe ? { ...attribs, target: "_blank", rel: "noopener noreferrer" } : { ...attribs, target: "", rel: "" } };
      },
      img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: "lazy" } }),
    },
  });
}

export default function ArticleContent({ contenu }: { contenu: string }) {
  if (estHtml(contenu)) {
    return <div className="article-body" dangerouslySetInnerHTML={{ __html: nettoyerHtml(contenu) }} />;
  }
  return (
    <div className="article-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h2>{children}</h2>,
          a: ({ href, children }) => {
            const externe = /^https?:\/\//i.test(href ?? "") && !/^https?:\/\/(www\.)?shiftup\.bj/i.test(href ?? "");
            return <a href={href} {...(externe ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{children}</a>;
          },
          table: ({ children }) => <div className="article-table"><table>{children}</table></div>,
        }}
      >
        {contenu}
      </ReactMarkdown>
    </div>
  );
}
