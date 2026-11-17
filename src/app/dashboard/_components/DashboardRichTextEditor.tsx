'use client';

import TiptapLink from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { Editor, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  ExternalLink,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Redo2,
  Unlink2,
  Undo2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useGetDashboardBlogPostsQuery } from '@/app/dashboard/redux/reducers/BlogPostsSlice/BlogPostsApiSlice';
import { useGetProductsQuery } from '@/features/products/productsApi';
import type { Product } from '@/types/products';
import type { BlogPost } from '@/types/blog';

type DashboardRichTextEditorProps = {
  label: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  error?: string;
  maxLength?: number;
  /** Picker to insert links to products and blog posts. Default: true. */
  showInternalLinks?: boolean;
};

function toolbarButtonClass() {
  return 'inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#d1d5db] bg-white text-[#374151] hover:bg-[#f3f4f6]';
}

function toolbarSelectClass() {
  return 'h-9 rounded-md border border-[#d1d5db] bg-white px-2 text-sm text-[#374151] focus:outline-none';
}

function normalizeEditorHtml(raw: string): string {
  const html = raw.replace(/\u00a0/g, ' ').trim();
  if (html === '' || html === '<br>' || html === '<div><br></div>' || html === '<p><br></p>') {
    return '';
  }
  return raw;
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

function applyOrInsertLink(editor: Editor, href: string, plainLabel?: string) {
  const attrs = linkAttrsForHref(href);
  const { empty } = editor.state.selection;
  if (empty) {
    const label = (plainLabel ?? href).trim() || href;
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

export default function DashboardRichTextEditor({
  label,
  value,
  onChange,
  placeholder,
  error,
  maxLength,
  showInternalLinks = true,
}: DashboardRichTextEditorProps) {
  const [mode, setMode] = useState<'visual' | 'preview' | 'html'>('visual');
  const [formatBlock, setFormatBlock] = useState('p');
  const [internalOpen, setInternalOpen] = useState(false);
  const [externalUrl, setExternalUrl] = useState('');
  const externalUrlInputRef = useRef<HTMLInputElement>(null);
  const [externalSectionOpen, setExternalSectionOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(true);
  const [blogsOpen, setBlogsOpen] = useState(true);

  const { data: productsRes, isFetching: productsLoading } = useGetProductsQuery(
    { page: 1, limit: 500, is_active: true },
    { skip: !showInternalLinks || !internalOpen },
  );
  const { data: blogRes, isFetching: blogsLoading } = useGetDashboardBlogPostsQuery(
    { page: 1, limit: 200, is_published: true },
    { skip: !showInternalLinks || !internalOpen },
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

  const editorExtensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Underline,
      TiptapLink.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { class: 'text-[#2563eb] underline underline-offset-2' },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({
        placeholder: placeholder || 'Write content here...',
      }),
    ],
    [placeholder],
  );

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: editorExtensions,
      content: value || '',
      editorProps: {
        attributes: {
          class: [
            'prose prose-sm max-w-none min-h-[220px] w-full focus:outline-none',
            'px-3 py-2.5 text-sm text-[#111111] [&_a]:text-[#2563eb] [&_a]:underline',
          ].join(' '),
        },
      },
      onUpdate: ({ editor: ed }) => {
        onChange(normalizeEditorHtml(ed.getHTML()));
      },
    },
    [editorExtensions],
  );

  useEffect(() => {
    if (!editor) return;
    const next = normalizeEditorHtml(value || '');
    const cur = normalizeEditorHtml(editor.getHTML());
    if (next === cur) return;
    editor.commands.setContent(value || '', { emitUpdate: false });
  }, [value, editor]);

  useEffect(() => {
    if (mode !== 'visual') setInternalOpen(false);
  }, [mode]);

  function runSync(fn: (ed: Editor) => void) {
    if (!editor) return;
    fn(editor);
    onChange(normalizeEditorHtml(editor.getHTML()));
  }

  useEffect(() => {
    if (!editor) return;
    const ed: Editor = editor;
    function onTransaction() {
      if (ed.isActive('heading', { level: 1 })) setFormatBlock('h1');
      else if (ed.isActive('heading', { level: 2 })) setFormatBlock('h2');
      else if (ed.isActive('heading', { level: 3 })) setFormatBlock('h3');
      else setFormatBlock('p');
    }
    ed.on('transaction', onTransaction);
    return () => {
      ed.off('transaction', onTransaction);
    };
  }, [editor]);

  function applyExternalUrlLink() {
    if (!editor) return;
    const href = normalizeExternalHref(externalUrl);
    if (!href) return;
    applyOrInsertLink(editor, href, externalUrl.trim() || href);
    onChange(normalizeEditorHtml(editor.getHTML()));
    setExternalUrl('');
    setInternalOpen(false);
  }

  function insertProductLink(p: Product) {
    if (!editor) return;
    const slug = (p.slug ?? '').trim();
    if (!slug) return;
    applyOrInsertLink(editor, `/products/${encodeURIComponent(slug)}`, p.name);
    onChange(normalizeEditorHtml(editor.getHTML()));
    setInternalOpen(false);
  }

  function insertBlogLink(post: BlogPost) {
    if (!editor) return;
    const slug = (post.slug ?? '').trim();
    if (!slug) return;
    applyOrInsertLink(editor, `/blogs/${encodeURIComponent(slug)}`, post.title);
    onChange(normalizeEditorHtml(editor.getHTML()));
    setInternalOpen(false);
  }

  const isVisual = mode === 'visual';
  const isPreview = mode === 'preview';
  const isHtml = mode === 'html';
  const charCount = useMemo(() => plainTextLength(value), [value]);

  if (!editor) {
    return (
      <div className="space-y-1.5">
        <span className="text-sm font-medium text-[#111111]">{label}</span>
        <div className="min-h-[300px] animate-pulse rounded-b-xl border border-[#dbe1ea] bg-[#f3f4f6]" />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium text-[#111111]">{label}</span>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-xl border border-[#dbe1ea] bg-[#f8fafc] p-2">
        <div className="inline-flex rounded-lg border border-[#d1d5db] bg-white p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode('visual')}
            className={`rounded-md px-2.5 py-1 ${isVisual ? 'bg-[#111111] text-white' : 'text-[#374151]'}`}
          >
            Visual
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={`rounded-md px-2.5 py-1 ${isPreview ? 'bg-[#111111] text-white' : 'text-[#374151]'}`}
          >
            Preview
          </button>
          <button
            type="button"
            onClick={() => setMode('html')}
            className={`rounded-md px-2.5 py-1 ${isHtml ? 'bg-[#111111] text-white' : 'text-[#374151]'}`}
          >
            HTML
          </button>
        </div>

        {isVisual ? (
          <div className="flex max-w-full flex-1 flex-wrap items-center justify-end gap-1">
            <select
              value={formatBlock}
              onChange={(e) => {
                const v = e.target.value;
                setFormatBlock(v);
                runSync((ed) => {
                  if (v === 'h1') ed.chain().focus().setHeading({ level: 1 }).run();
                  else if (v === 'h2') ed.chain().focus().setHeading({ level: 2 }).run();
                  else if (v === 'h3') ed.chain().focus().setHeading({ level: 3 }).run();
                  else if (v === 'blockquote') ed.chain().focus().setBlockquote().run();
                  else ed.chain().focus().setParagraph().run();
                });
              }}
              className={toolbarSelectClass()}
              title="Block style"
            >
              <option value="p">Paragraph</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
              <option value="blockquote">Quote</option>
            </select>

            <button
              type="button"
              onClick={() => runSync((ed) => void ed.chain().focus().toggleBold().run())}
              className={toolbarButtonClass()}
              title="Bold"
            >
              <Bold size={14} />
            </button>
            <button
              type="button"
              onClick={() => runSync((ed) => void ed.chain().focus().toggleItalic().run())}
              className={toolbarButtonClass()}
              title="Italic"
            >
              <Italic size={14} />
            </button>
            <button
              type="button"
              onClick={() => runSync((ed) => void ed.chain().focus().toggleUnderline().run())}
              className={toolbarButtonClass()}
              title="Underline"
            >
              <span className="text-xs font-semibold underline">U</span>
            </button>
            <button
              type="button"
              onClick={() => runSync((ed) => void ed.chain().focus().setHeading({ level: 1 }).run())}
              className={toolbarButtonClass()}
              title="Heading 1"
            >
              <Heading1 size={14} />
            </button>
            <button
              type="button"
              onClick={() => runSync((ed) => void ed.chain().focus().setHeading({ level: 2 }).run())}
              className={toolbarButtonClass()}
              title="Heading 2"
            >
              <Heading2 size={14} />
            </button>
            <button
              type="button"
              onClick={() => runSync((ed) => void ed.chain().focus().setHeading({ level: 3 }).run())}
              className={toolbarButtonClass()}
              title="Heading 3"
            >
              <Heading3 size={14} />
            </button>
            <button
              type="button"
              onClick={() => runSync((ed) => void ed.chain().focus().toggleBulletList().run())}
              className={toolbarButtonClass()}
              title="Bullet list"
            >
              <List size={14} />
            </button>
            <button
              type="button"
              onClick={() => runSync((ed) => void ed.chain().focus().toggleOrderedList().run())}
              className={toolbarButtonClass()}
              title="Numbered list"
            >
              <ListOrdered size={14} />
            </button>
            <button
              type="button"
              onClick={() => runSync((ed) => void ed.chain().focus().setTextAlign('left').run())}
              className={toolbarButtonClass()}
              title="Align left"
            >
              <AlignLeft size={14} />
            </button>
            <button
              type="button"
              onClick={() => runSync((ed) => void ed.chain().focus().setTextAlign('center').run())}
              className={toolbarButtonClass()}
              title="Align center"
            >
              <AlignCenter size={14} />
            </button>
            <button
              type="button"
              onClick={() => runSync((ed) => void ed.chain().focus().setTextAlign('right').run())}
              className={toolbarButtonClass()}
              title="Align right"
            >
              <AlignRight size={14} />
            </button>
            <button
              type="button"
              onClick={() => runSync((ed) => void ed.chain().focus().setTextAlign('justify').run())}
              className={toolbarButtonClass()}
              title="Justify"
            >
              <AlignJustify size={14} />
            </button>
            <button
              type="button"
              onClick={() => runSync((ed) => void ed.chain().focus().unsetLink().run())}
              className={toolbarButtonClass()}
              title="Remove link"
            >
              <Unlink2 size={14} />
            </button>
            <button
              type="button"
              onClick={() => runSync((ed) => void ed.chain().focus().undo().run())}
              className={toolbarButtonClass()}
              title="Undo"
            >
              <Undo2 size={14} />
            </button>
            <button
              type="button"
              onClick={() => runSync((ed) => void ed.chain().focus().redo().run())}
              className={toolbarButtonClass()}
              title="Redo"
            >
              <Redo2 size={14} />
            </button>
            {showInternalLinks ? (
              <button
                type="button"
                onClick={() => {
                  if (!editor) return;
                  editor.commands.focus();
                  const opening = !internalOpen;
                  if (opening) setExternalUrl('');
                  setInternalOpen(opening);
                }}
                className={`ml-0.5 inline-flex h-8 items-center justify-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold hover:bg-[#dbeafe] ${
                  internalOpen
                    ? 'border-[#1d4ed8] bg-[#dbeafe] text-[#1e3a8a]'
                    : 'border-[#3b82f6] bg-[#eff6ff] text-[#1d4ed8]'
                }`}
                title="Add a link — select text first, then pick a product, blog, or external URL"
              >
                <Link2 size={14} />
                + Link
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {isVisual && showInternalLinks && internalOpen ? (
        <div className="border-l border-r border-t border-[#dbe1ea] bg-white px-3 py-2">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#64748b]">Link to</p>
          <p className="mb-2 text-[11px] leading-snug text-[#94a3b8]">
            Products: active only. Blog posts: published only (visible on the blog).
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
                        onClick={() => insertProductLink(p)}
                        className="w-full rounded px-1.5 py-0.5 text-left text-[#1e3a8a] hover:bg-[#eff6ff]"
                      >
                        {p.name}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            ) : null}

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
                        onClick={() => insertBlogLink(b)}
                        className="w-full rounded px-1.5 py-0.5 text-left text-[#1e3a8a] hover:bg-[#eff6ff]"
                      >
                        {b.title}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            ) : null}

            <button
              type="button"
              onClick={() => {
                setExternalSectionOpen((v) => {
                  const next = !v;
                  if (next) {
                    window.requestAnimationFrame(() => externalUrlInputRef.current?.focus());
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
                  Select text in the editor, enter the URL, then apply — same as picking a product. https:// opens
                  in a new tab.
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
          </div>
        </div>
      ) : null}

      {isVisual && showInternalLinks ? (
        <p className="mt-1 px-2 text-xs text-[#64748b]">
          Select words in the editor, open + Link, then choose a product, blog post, or Website URL.
        </p>
      ) : null}

      {isVisual ? (
        <div
          className={
            error
              ? 'rounded-b-xl border border-t-0 border-red-500'
              : 'rounded-b-xl border border-t-0 border-[#dbe1ea]'
          }
        >
          <EditorContent editor={editor} />
        </div>
      ) : null}

      {isPreview ? (
        <div
          className={`prose prose-sm max-w-none min-h-[260px] w-full overflow-y-auto rounded-b-xl border border-t-0 bg-white px-3 py-2.5 text-[#111111] ${
            error ? 'border-red-500' : 'border-[#dbe1ea]'
          }`}
          dangerouslySetInnerHTML={{
            __html: value || '<p style="color:#9ca3af;">Preview is empty.</p>',
          }}
        />
      ) : null}

      {isHtml ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="<p>Write HTML here...</p>"
          className={`min-h-[260px] w-full rounded-b-xl border border-t-0 bg-white px-3 py-2.5 font-mono text-sm text-[#111111] focus:outline-none ${
            error ? 'border-red-500' : 'border-[#dbe1ea]'
          }`}
        />
      ) : null}

      <style jsx global>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror:focus {
          outline: none;
        }
      `}</style>

      {typeof maxLength === 'number' ? (
        <p className="text-xs text-[#9ca3af]">
          {Math.min(charCount, maxLength)}/{maxLength} characters
        </p>
      ) : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
