'use client';

import TiptapLink from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Editor, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { ChevronDown, ExternalLink, Link2, Unlink2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useGetDashboardBlogPostsQuery } from '@/app/dashboard/redux/reducers/BlogPostsSlice/BlogPostsApiSlice';
import { useGetProductsQuery } from '@/features/products/productsApi';
import type { BlogPost } from '@/types/blog';
import type { Product } from '@/types/products';

export type ProductDescriptionLinkSource = 'products' | 'products-and-blogs';

type ProductDescriptionFieldProps = {
  label: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  error?: string;
  maxLength?: number;
  /** `products` = only /products/… links in the picker. Default: also list blog posts. */
  linkSource?: ProductDescriptionLinkSource;
  /** Prompt for https/mailto/path URLs (toolbar). Default: true. */
  showExternalLink?: boolean;
};

function looksLikeHtml(s: string) {
  return /<\/?[a-z][\s\S]*?>/i.test(s.trim());
}

function plainTextToTiptapHtml(plain: string) {
  const t = plain.replace(/\r\n/g, '\n').trim();
  if (!t) return '<p></p>';
  const blocks = t.split(/\n\n/);
  return blocks.map((block) => {
    const safe = escapeHtmlForPlainBlock(block);
    return `<p>${safe.replace(/\n/g, '<br>')}</p>`;
  }).join('');
}

function escapeHtmlForPlainBlock(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function normalizeEditorHtml(raw: string): string {
  const t = String(raw ?? '');
  if (t.replace(/\s/g, '') === '' || t === '<p></p>' || t === '<p><br></p>') return '';
  return t;
}

function plainTextLength(rawHtml: string): number {
  if (!rawHtml) return 0;
  if (typeof document === 'undefined') return rawHtml.length;
  const el = document.createElement('div');
  el.innerHTML = rawHtml;
  return (el.textContent || '').length;
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalizeExternalHref(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (
    /^https?:\/\//i.test(trimmed) ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('mailto:')
  ) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function linkAttrsForHref(href: string): {
  href: string;
  target?: string;
  rel?: string;
} {
  if (/^https?:\/\//i.test(href)) {
    return { href, target: '_blank', rel: 'noopener noreferrer' };
  }
  return { href };
}

function applyOrInsertLink(editor: Editor, href: string, defaultLabel: string) {
  const attrs = linkAttrsForHref(href);
  const { empty } = editor.state.selection;
  if (empty) {
    const label = (defaultLabel ?? href).trim() || href;
    const safe = escapeHtml(label);
    const targetRel =
      attrs.target && attrs.rel
        ? ` target="${attrs.target}" rel="${escapeHtml(attrs.rel)}"`
        : '';
    editor
      .chain()
      .focus()
      .insertContent(`<a href="${escapeHtml(href)}"${targetRel}>${safe}</a> `)
      .run();
    return;
  }
  editor.chain().focus().extendMarkRange('link').setLink(attrs).run();
}

/**
 * WYSIWYG: text + link marks (blue, underlined) — no raw &lt;a&gt; tags in the field.
 * `linkSource="products"`: only product links in the picker.
 * `linkSource="products-and-blogs"` (default): product + blog links.
 */
export default function ProductDescriptionField({
  label,
  value,
  onChange,
  placeholder,
  error,
  maxLength,
  linkSource = 'products-and-blogs',
  showExternalLink = true,
}: ProductDescriptionFieldProps) {
  const onChangeRef = useRef(onChange);
  const editorRef = useRef<Editor | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const [internalOpen, setInternalOpen] = useState(false);
  const [externalUrl, setExternalUrl] = useState('');
  const externalUrlInputRef = useRef<HTMLInputElement>(null);
  const [productsOpen, setProductsOpen] = useState(true);
  const [blogsOpen, setBlogsOpen] = useState(true);
  const [externalSectionOpen, setExternalSectionOpen] = useState(false);

  const productsOnly = linkSource === 'products';

  const { data: productsRes, isFetching: productsLoading } = useGetProductsQuery(
    { page: 1, limit: 500, is_active: true },
    { skip: !internalOpen },
  );
  const { data: blogRes, isFetching: blogsLoading } = useGetDashboardBlogPostsQuery(
    { page: 1, limit: 200, is_published: true },
    { skip: !internalOpen || productsOnly },
  );

  const productRows = useMemo((): Product[] => {
    const list = productsRes?.data ?? [];
    return [...list]
      .filter((p) => p.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [productsRes?.data]);
  const blogRows = useMemo((): BlogPost[] => {
    const list = blogRes?.data ?? [];
    return [...list]
      .filter((b) => b.isPublished)
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [blogRes?.data]);

  const charCount = useMemo(() => plainTextLength(value), [value]);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        blockquote: false,
        bold: false,
        bulletList: false,
        code: false,
        codeBlock: false,
        dropcursor: false,
        gapcursor: false,
        hardBreak: {},
        heading: false,
        horizontalRule: false,
        italic: false,
        listItem: false,
        listKeymap: false,
        orderedList: false,
        strike: false,
        trailingNode: false,
        underline: false,
        link: false,
      }),
      TiptapLink.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { class: 'text-[#2563eb] underline' },
      }),
      Placeholder.configure({ placeholder: placeholder || 'Write the description...' }),
    ],
    [placeholder],
  );

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions,
      content: '<p></p>',
      editorProps: {
        attributes: {
          class: [
            'prose prose-sm max-w-none min-h-[120px] w-full px-3 py-2.5 text-sm text-[#111111] focus:outline-none',
            '[&_a]:text-[#2563eb] [&_a]:underline',
          ].join(' '),
        },
        handlePaste: (_view, event) => {
          const t = event.clipboardData?.getData('text/plain') ?? '';
          if (!t) return false;
          event.preventDefault();
          const inst = editorRef.current;
          if (inst) {
            const asHtml = plainTextToTiptapHtml(t);
            inst.chain().focus().insertContent(asHtml).run();
          }
          return true;
        },
      },
      onUpdate: ({ editor: ed }) => {
        onChangeRef.current(normalizeEditorHtml(ed.getHTML()));
      },
      onCreate: ({ editor: ed }) => {
        editorRef.current = ed;
      },
      onDestroy: () => {
        editorRef.current = null;
      },
    },
    [extensions],
  );

  // Sync from parent
  useEffect(() => {
    if (!editor) return;
    const v = value ?? '';
    const existing = editor.getHTML();
    const nextContent = !v
      ? '<p></p>'
      : !looksLikeHtml(v)
        ? plainTextToTiptapHtml(v)
        : v;
    if (normalizeEditorHtml(existing) === normalizeEditorHtml(nextContent)) return;
    editor.commands.setContent(nextContent, { emitUpdate: false });
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="space-y-1.5">
        <span className="text-sm font-medium text-[#111111]">{label}</span>
        <div className="min-h-[160px] animate-pulse rounded-xl border border-[#dbe1ea] bg-[#f3f4f6]" />
      </div>
    );
  }

  const applyProduct = (p: Product) => {
    const slug = (p.slug ?? '').trim();
    if (!slug) return;
    const href = `/products/${encodeURIComponent(slug)}`;
    applyOrInsertLink(editor, href, p.name);
    setInternalOpen(false);
  };

  const applyPost = (post: BlogPost) => {
    const slug = (post.slug ?? '').trim();
    if (!slug) return;
    const href = `/blogs/${encodeURIComponent(slug)}`;
    applyOrInsertLink(editor, href, post.title);
    setInternalOpen(false);
  };

  function applyExternalUrlLink() {
    const ed = editor;
    const href = normalizeExternalHref(externalUrl);
    if (!href || !ed) return;
    applyOrInsertLink(ed, href, externalUrl.trim() || href);
    setExternalUrl('');
    setInternalOpen(false);
  }

  function toolbarButtonClass() {
    return 'inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#d1d5db] bg-white text-[#374151] hover:bg-[#f3f4f6]';
  }

  const linkPickerLabel = showExternalLink
    ? '+ Link'
    : productsOnly
      ? '+ Product'
      : '+ Product / blog';
  const linkPickerTitle = showExternalLink
    ? 'Add a link — select text in the editor first, then pick a product, blog, or external URL'
    : productsOnly
      ? 'Add a link to a product (select text first to wrap it)'
      : 'Add a link to a product or blog (select text first to wrap it)';

  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium text-[#111111]">{label}</span>

      <div
        className={`overflow-hidden rounded-xl border bg-white ${
          error ? 'border-red-500' : 'border-[#dbe1ea]'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2 border-b border-[#e5e7eb] bg-[#f8fafc] px-2 py-2">
          <button
            type="button"
            onClick={() => {
              const opening = !internalOpen;
              if (opening) setExternalUrl('');
              setInternalOpen(opening);
              editor.commands.focus();
            }}
            className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold hover:bg-[#dbeafe] ${
              internalOpen
                ? 'border-[#1d4ed8] bg-[#dbeafe] text-[#1e3a8a]'
                : 'border-[#3b82f6] bg-[#eff6ff] text-[#1d4ed8]'
            }`}
            title={linkPickerTitle}
          >
            <Link2 size={14} aria-hidden />
            {linkPickerLabel}
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            className={toolbarButtonClass()}
            title="Remove link from selection"
          >
            <Unlink2 size={14} aria-hidden />
          </button>
          <p className="text-xs text-[#64748b]">
            {showExternalLink
              ? 'Type in the editor, select the words to link, open + Link, then choose a product or Website URL — same steps for both.'
              : productsOnly
                ? 'Product links appear in blue. Select text first, or the product name is inserted.'
                : 'Links appear in blue. Select text first, then pick an item, or the item name is inserted.'}
          </p>
        </div>

        {internalOpen ? (
          <div className="border-b border-[#e5e7eb] bg-white px-3 py-2">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#64748b]">Link to</p>
            <p className="mb-2 text-[11px] leading-snug text-[#94a3b8]">
              {productsOnly
                ? 'Products listed here are active only (same as storefront).'
                : 'Products: active only. Blog posts: published only (visible on the blog).'}
            </p>
            <div className="max-h-56 space-y-1 overflow-y-auto text-sm">
              <button
                type="button"
                onClick={() => setProductsOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-lg bg-[#f8fafc] px-2 py-1.5 text-left text-[#0f172a] hover:bg-[#f1f5f9]"
              >
                <span>Products</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform ${productsOpen ? 'rotate-0' : '-rotate-90'}`}
                  aria-hidden
                />
              </button>
              {productsOpen ? (
                <ul className="ml-1 space-y-0.5 border-l border-[#e2e8f0] pl-2">
                  {productsLoading ? (
                    <li className="text-xs text-[#9ca3af]">Loading…</li>
                  ) : productRows.length === 0 ? (
                    <li className="text-xs text-[#9ca3af]">No active products</li>
                  ) : (
                    productRows.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => applyProduct(p)}
                          className="w-full rounded px-1.5 py-0.5 text-left text-[#1e3a8a] hover:bg-[#eff6ff]"
                        >
                          {p.name}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              ) : null}

              {!productsOnly ? (
                <>
                  <button
                    type="button"
                    onClick={() => setBlogsOpen((v) => !v)}
                    className="mt-2 flex w-full items-center justify-between rounded-lg bg-[#f8fafc] px-2 py-1.5 text-left text-[#0f172a] hover:bg-[#f1f5f9]"
                  >
                    <span>Blog posts</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition-transform ${blogsOpen ? 'rotate-0' : '-rotate-90'}`}
                      aria-hidden
                    />
                  </button>
                  {blogsOpen ? (
                    <ul className="ml-1 space-y-0.5 border-l border-[#e2e8f0] pl-2">
                      {blogsLoading ? (
                        <li className="text-xs text-[#9ca3af]">Loading…</li>
                      ) : blogRows.length === 0 ? (
                        <li className="text-xs text-[#9ca3af]">No published posts</li>
                      ) : (
                        blogRows.map((b) => (
                          <li key={b.id}>
                            <button
                              type="button"
                              onClick={() => applyPost(b)}
                              className="w-full rounded px-1.5 py-0.5 text-left text-[#1e3a8a] hover:bg-[#eff6ff]"
                            >
                              {b.title}
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  ) : null}
                </>
              ) : null}

              {showExternalLink ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setExternalSectionOpen((v) => {
                        const next = !v;
                        if (next) {
                          window.requestAnimationFrame(() =>
                            externalUrlInputRef.current?.focus(),
                          );
                        }
                        return next;
                      });
                    }}
                    className="mt-2 flex w-full items-center justify-between rounded-lg bg-[#f8fafc] px-2 py-1.5 text-left text-[#0f172a] hover:bg-[#f1f5f9]"
                  >
                    <span className="flex items-center gap-1.5">
                      <ExternalLink size={14} className="shrink-0 text-[#0f766e]" aria-hidden />
                      Website or external URL
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition-transform ${externalSectionOpen ? 'rotate-0' : '-rotate-90'}`}
                      aria-hidden
                    />
                  </button>
                  {externalSectionOpen ? (
                    <div className="ml-1 space-y-2 border-l border-[#e2e8f0] pl-2 pt-1">
                      <input
                        ref={externalUrlInputRef}
                        type="text"
                        value={externalUrl}
                        onChange={(e) => setExternalUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            applyExternalUrlLink();
                          }
                        }}
                        className="h-9 w-full rounded-lg border border-[#dbe1ea] bg-white px-2.5 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
                        placeholder="https://… , mailto:… , or /about"
                        autoComplete="off"
                        aria-label="External link URL"
                      />
                      <p className="text-xs text-[#9ca3af]">
                        Select text in the editor, paste or type the URL, then apply — same as picking a product.
                        https:// opens in a new tab.
                      </p>
                      <button
                        type="button"
                        disabled={!normalizeExternalHref(externalUrl)}
                        onClick={() => applyExternalUrlLink()}
                        className="w-full rounded px-1.5 py-1.5 text-left text-sm font-medium text-[#1e3a8a] hover:bg-[#eff6ff] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Apply link
                      </button>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        ) : null}

        <div
          className="[&_.ProseMirror]:min-h-[120px] [&_.ProseMirror_p]:m-0 [&_.ProseMirror_p+p]:mt-1"
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      {typeof maxLength === 'number' ? (
        <p className="text-xs text-[#9ca3af]">
          {Math.min(charCount, maxLength)}/{maxLength} characters
        </p>
      ) : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      <style jsx global>{`
        .ProseMirror:focus {
          outline: none;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  );
}
