import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import UnderlineExt from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Placeholder from '@tiptap/extension-placeholder';
import FontFamily from '@tiptap/extension-font-family';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import CharacterCount from '@tiptap/extension-character-count';
import {
  Bold, Italic, Underline as UnderlineIcon, List, AlignLeft, AlignCenter,
  AlignRight, AlignJustify, Link2, Code, RotateCcw, RotateCw,
  Maximize2, Minimize2, Eye, EyeOff, Check, X,
} from 'lucide-react';
import {
  RiStrikethrough, RiSubscript, RiSuperscript, RiH1, RiH2, RiH3,
  RiListOrdered, RiDoubleQuotesL, RiFormatClear, RiTableLine,
  RiMarkPenLine, RiCodeBoxLine, RiSeparator,
  RiInsertRowBottom, RiInsertColumnRight, RiDeleteRow, RiDeleteColumn,
} from 'react-icons/ri';

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  onSave?: () => Promise<void> | void;
  placeholder?: string;
  minHeight?: number;
  allowFullscreen?: boolean;
}

// ─── Toolbar Button ───────────────────────────────────────────────────────────
function TBtn({
  onClick, active, disabled, title, children, danger,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); if (!disabled) onClick(); }}
      disabled={disabled}
      title={title}
      className={[
        'p-1.5 rounded-md transition-all duration-100 flex-shrink-0 select-none text-[13px]',
        disabled ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer',
        active
          ? 'bg-primary/20 text-primary shadow-sm'
          : danger
            ? 'text-muted-foreground hover:bg-red-500/15 hover:text-red-400'
            : 'text-muted-foreground hover:bg-white/8 hover:text-on-surface',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-4 mx-0.5 self-center bg-white/10 flex-shrink-0" />;
}

// ─── Link Popover ─────────────────────────────────────────────────────────────
function LinkPopover({
  editor,
  onClose,
}: {
  editor: ReturnType<typeof useEditor>;
  onClose: () => void;
}) {
  const [url, setUrl] = useState(editor?.getAttributes('link').href ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const apply = useCallback(() => {
    const trimmed = url.trim();
    if (!trimmed) {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      const href = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      editor?.chain().focus().extendMarkRange('link').setLink({ href }).run();
    }
    onClose();
  }, [url, editor, onClose]);

  const remove = useCallback(() => {
    editor?.chain().focus().extendMarkRange('link').unsetLink().run();
    onClose();
  }, [editor, onClose]);

  return (
    <div
      className="absolute top-full mt-1.5 left-0 z-50 flex items-center gap-1.5 p-2 rounded-xl shadow-2xl border border-white/10"
      style={{ background: 'hsl(var(--surface-container))', minWidth: 280 }}
      onMouseDown={e => e.stopPropagation()}
    >
      <Link2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      <input
        ref={inputRef}
        value={url}
        onChange={e => setUrl(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); apply(); }
          if (e.key === 'Escape') onClose();
        }}
        placeholder="https://..."
        className="flex-1 text-xs bg-transparent outline-none text-on-surface placeholder:text-muted-foreground/40 min-w-0"
      />
      <button
        onMouseDown={e => { e.preventDefault(); apply(); }}
        className="p-1 rounded-md hover:bg-primary/20 text-primary transition-colors"
        title="Apply"
      >
        <Check className="w-3.5 h-3.5" />
      </button>
      {editor?.isActive('link') && (
        <button
          onMouseDown={e => { e.preventDefault(); remove(); }}
          className="p-1 rounded-md hover:bg-red-500/15 text-muted-foreground hover:text-red-400 transition-colors"
          title="Remove link"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      <button
        onMouseDown={e => { e.preventDefault(); onClose(); }}
        className="p-1 rounded-md hover:bg-white/8 text-muted-foreground transition-colors"
        title="Cancel"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Toolbar ─────────────────────────────────────────────────────────────────
function Toolbar({
  editor,
  isFullscreen,
  setFullscreen,
  showPreview,
  setShowPreview,
  allowFullscreen,
}: {
  editor: ReturnType<typeof useEditor> | null;
  isFullscreen: boolean;
  setFullscreen: (v: boolean) => void;
  showPreview: boolean;
  setShowPreview: (v: boolean) => void;
  allowFullscreen: boolean;
}) {
  const [showLinkPopover, setShowLinkPopover] = useState(false);

  if (!editor) return null;

  const inTable = editor.isActive('table');

  return (
    <div
      className="flex flex-wrap items-center gap-y-0.5 gap-x-0 px-2 py-1.5 border-b border-white/8 flex-shrink-0"
      style={{ background: 'hsl(var(--surface-container))' }}
    >
      {/* History */}
      <TBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (Ctrl+Z)">
        <RotateCcw size={13} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (Ctrl+Y)">
        <RotateCw size={13} />
      </TBtn>

      <Sep />

      {/* Headings */}
      <TBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
        <RiH1 size={14} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
        <RiH2 size={14} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
        <RiH3 size={14} />
      </TBtn>

      <Sep />

      {/* Font family */}
      <select
        onMouseDown={e => e.stopPropagation()}
        onChange={e => {
          if (!e.target.value) editor.chain().focus().unsetFontFamily().run();
          else editor.chain().focus().setFontFamily(e.target.value).run();
        }}
        value={editor.getAttributes('textStyle').fontFamily ?? ''}
        title="Font Family"
        className="text-[11px] rounded-md px-1 py-0.5 outline-none cursor-pointer border"
        style={{
          background: 'hsl(var(--surface-bright))',
          border: '1px solid hsl(var(--border) / 0.35)',
          color: 'hsl(var(--on-surface-variant))',
          maxWidth: 76,
        }}
      >
        <option value="">Default</option>
        <option value="Arial, sans-serif">Arial</option>
        <option value="Georgia, serif">Georgia</option>
        <option value="Times New Roman, serif">Times</option>
        <option value="Courier New, monospace">Mono</option>
        <option value="Verdana, sans-serif">Verdana</option>
      </select>

      {/* Text color */}
      <div title="Text Color" className="flex-shrink-0">
        <input
          type="color"
          onMouseDown={e => e.stopPropagation()}
          onChange={e => editor.chain().focus().setColor(e.target.value).run()}
          value={editor.getAttributes('textStyle').color ?? '#e2e8f0'}
          className="w-6 h-6 rounded cursor-pointer border border-white/10"
          style={{ padding: 1, background: 'transparent' }}
          title="Text Color"
        />
      </div>

      <Sep />

      {/* Inline marks */}
      <TBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)">
        <Bold size={13} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)">
        <Italic size={13} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Ctrl+U)">
        <UnderlineIcon size={13} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
        <RiStrikethrough size={14} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight">
        <RiMarkPenLine size={14} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive('subscript')} title="Subscript">
        <RiSubscript size={14} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')} title="Superscript">
        <RiSuperscript size={14} />
      </TBtn>

      <Sep />

      {/* Alignment */}
      <TBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left">
        <AlignLeft size={13} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Center">
        <AlignCenter size={13} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right">
        <AlignRight size={13} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify">
        <AlignJustify size={13} />
      </TBtn>

      <Sep />

      {/* Lists */}
      <TBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
        <List size={13} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List">
        <RiListOrdered size={14} />
      </TBtn>

      <Sep />

      {/* Blocks */}
      <TBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
        <RiDoubleQuotesL size={14} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block">
        <RiCodeBoxLine size={14} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline Code">
        <Code size={13} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
        <RiSeparator size={14} />
      </TBtn>

      <Sep />

      {/* Link */}
      <div className="relative flex-shrink-0">
        <TBtn
          onClick={() => setShowLinkPopover(p => !p)}
          active={editor.isActive('link') || showLinkPopover}
          title="Insert / Edit Link (Ctrl+K)"
        >
          <Link2 size={13} />
        </TBtn>
        {showLinkPopover && (
          <LinkPopover editor={editor} onClose={() => setShowLinkPopover(false)} />
        )}
      </div>

      {/* Table insert */}
      <TBtn
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        title="Insert Table"
        active={inTable}
      >
        <RiTableLine size={14} />
      </TBtn>

      {/* Table controls — only when cursor is inside a table */}
      {inTable && (
        <>
          <Sep />
          <TBtn onClick={() => editor.chain().focus().addRowAfter().run()} title="Add Row Below">
            <RiInsertRowBottom size={14} />
          </TBtn>
          <TBtn onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add Column Right">
            <RiInsertColumnRight size={14} />
          </TBtn>
          <TBtn onClick={() => editor.chain().focus().deleteRow().run()} title="Delete Row" danger>
            <RiDeleteRow size={14} />
          </TBtn>
          <TBtn onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete Column" danger>
            <RiDeleteColumn size={14} />
          </TBtn>
        </>
      )}

      <Sep />

      {/* Clear formatting */}
      <TBtn onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Clear Formatting">
        <RiFormatClear size={14} />
      </TBtn>

      {/* Spacer */}
      <div className="flex-1 min-w-1" />

      {/* Preview + Fullscreen */}
      <TBtn onClick={() => setShowPreview(!showPreview)} active={showPreview} title={showPreview ? 'Hide Preview' : 'Show Preview'}>
        {showPreview ? <EyeOff size={13} /> : <Eye size={13} />}
      </TBtn>
      {allowFullscreen && (
        <TBtn onClick={() => setFullscreen(!isFullscreen)} title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen (F11)'}>
          {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </TBtn>
      )}
    </div>
  );
}

// ─── Status Bar ───────────────────────────────────────────────────────────────
function StatusBar({
  words,
  chars,
  isDirty,
  lastSaved,
  saving,
  onSave,
}: {
  words: number;
  chars: number;
  isDirty: boolean;
  lastSaved: Date | null;
  saving: boolean;
  onSave?: () => void;
}) {
  const [, setTick] = useState(0);

  // Re-render every 30 s to keep the "X ago" timestamp fresh
  useEffect(() => {
    if (!lastSaved) return;
    const id = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(id);
  }, [lastSaved]);

  const timeAgo = lastSaved
    ? (() => {
        const s = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
        if (s < 5)  return 'just now';
        if (s < 60) return `${s}s ago`;
        if (s < 3600) return `${Math.floor(s / 60)}m ago`;
        return `${Math.floor(s / 3600)}h ago`;
      })()
    : null;

  return (
    <div
      className="flex items-center justify-between px-3 py-1.5 text-[11px] border-t border-white/8 flex-shrink-0 select-none"
      style={{ background: 'hsl(var(--surface-container))' }}
    >
      <span className="text-muted-foreground/50">
        {words} word{words !== 1 ? 's' : ''} · {chars} char{chars !== 1 ? 's' : ''}
      </span>

      <div className="flex items-center gap-2">
        {saving && (
          <span className="text-muted-foreground/60 flex items-center gap-1">
            <span className="w-2.5 h-2.5 border border-muted-foreground/30 border-t-muted-foreground/70 rounded-full animate-spin inline-block" />
            Saving…
          </span>
        )}
        {!saving && isDirty && (
          <span className="text-yellow-400/80 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />
            Unsaved changes
          </span>
        )}
        {!saving && !isDirty && timeAgo && (
          <span className="text-emerald-400/70 flex items-center gap-1">
            <Check className="w-2.5 h-2.5" />
            Saved {timeAgo}
          </span>
        )}
        {onSave && isDirty && !saving && (
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); onSave(); }}
            className="px-2 py-0.5 rounded-md bg-primary/15 text-primary font-semibold hover:bg-primary/25 transition-colors text-[11px]"
          >
            Save (Ctrl+S)
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Prose styles applied to both editor and preview ─────────────────────────
const PROSE_CLS = `
  [&_h1]:text-2xl [&_h1]:font-black [&_h1]:mb-3 [&_h1]:mt-5 [&_h1]:text-on-surface
  [&_h2]:text-xl  [&_h2]:font-bold  [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-on-surface
  [&_h3]:text-base [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-on-surface
  [&_p]:mb-3 [&_p]:leading-relaxed [&_p]:text-on-surface
  [&_ul]:list-disc   [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:space-y-1
  [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_ol]:space-y-1
  [&_li]:text-on-surface
  [&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4
    [&_blockquote]:text-muted-foreground [&_blockquote]:italic [&_blockquote]:my-3
  [&_code]:bg-white/8 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded
    [&_code]:font-mono [&_code]:text-xs [&_code]:text-primary
  [&_pre]:bg-white/5 [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:my-3
    [&_pre]:overflow-x-auto [&_pre]:font-mono [&_pre]:text-xs
  [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2
  [&_hr]:border-white/15 [&_hr]:my-4
  [&_table]:w-full [&_table]:border-collapse [&_table]:my-3
  [&_th]:bg-white/5 [&_th]:border [&_th]:border-white/15
    [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-sm
  [&_td]:border [&_td]:border-white/15 [&_td]:px-3 [&_td]:py-2 [&_td]:text-sm
  [&_.selectedCell]:bg-primary/10
  [&_.tiptap]:outline-none
  [&_.tiptap_p.is-editor-empty:first-child::before]:text-muted-foreground/35
  [&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
  [&_.tiptap_p.is-editor-empty:first-child::before]:float-left
  [&_.tiptap_p.is-editor-empty:first-child::before]:h-0
  [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none
`.trim();

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RichTextEditor({
  value,
  onChange,
  onSave,
  placeholder,
  minHeight = 380,
  allowFullscreen = true,
}: RichTextEditorProps) {
  // Prevent the external-value useEffect from re-syncing content we just produced
  const skipSync      = useRef(false);
  // Always-fresh ref so Ctrl+S inside editorProps can call the latest handleSave
  const handleSaveRef = useRef<(() => void) | null>(null);
  // Track client mount so createPortal works in Next.js SSR environment
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPreview,  setShowPreview]  = useState(false);
  const [isDirty,      setIsDirty]      = useState(false);
  const [lastSaved,    setLastSaved]    = useState<Date | null>(null);
  const [saving,       setSaving]       = useState(false);
  // Kept in state so the preview div re-renders on every keystroke
  const [liveHtml,     setLiveHtml]     = useState(value ?? '');
  const [wordCount,    setWordCount]    = useState(0);
  const [charCount,    setCharCount]    = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      // StarterKit already includes: Bold, Italic, Strike, Code, Blockquote,
      // BulletList, OrderedList, ListItem, Heading, HorizontalRule,
      // Paragraph, Text, Document, HardBreak, History
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      UnderlineExt,
      TextStyle,
      Color,
      FontFamily,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Subscript,
      Superscript,
      Placeholder.configure({ placeholder: placeholder ?? 'Start writing…' }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      CharacterCount,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      skipSync.current = true;
      const html = editor.getHTML();
      onChange(html);
      setLiveHtml(html);
      setIsDirty(true);
      // Update counts reactively
      const storage = (editor as any).storage?.characterCount;
      setWordCount(storage?.words()      ?? 0);
      setCharCount(storage?.characters() ?? 0);
    },
    onCreate: ({ editor }) => {
      // Seed word/char counts on initial load
      const storage = (editor as any).storage?.characterCount;
      setWordCount(storage?.words()      ?? 0);
      setCharCount(storage?.characters() ?? 0);
    },
    editorProps: {
      attributes: {
        class: 'outline-none',
        style: `min-height: ${minHeight}px; padding: 16px 20px; color: hsl(var(--on-surface));`,
        spellcheck: 'true',
      },
      handleKeyDown: (_view, event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
          event.preventDefault();
          handleSaveRef.current?.();
          return true;
        }
        return false;
      },
    },
  });

  // Sync external value changes back into the editor (e.g. initial API load)
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (skipSync.current) {
      skipSync.current = false;
      return;
    }
    const incoming = value ?? '';
    if (incoming !== editor.getHTML()) {
      editor.commands.setContent(incoming, { emitUpdate: false });
      setLiveHtml(incoming);
      setIsDirty(false);
      const storage = (editor as any).storage?.characterCount;
      setWordCount(storage?.words()      ?? 0);
      setCharCount(storage?.characters() ?? 0);
    }
  }, [value, editor]);

  // Wrap onSave to manage saving/dirty/lastSaved state
  const handleSave = useCallback(async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave();
      setIsDirty(false);
      setLastSaved(new Date());
    } catch {
      // onSave handles its own error toasts; we stay dirty
    } finally {
      setSaving(false);
    }
  }, [onSave]);

  // Keep ref fresh so editorProps.handleKeyDown always calls the latest handleSave
  useEffect(() => { handleSaveRef.current = handleSave; }, [handleSave]);

  // F11 + Escape for fullscreen
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (allowFullscreen && e.key === 'F11' && containerRef.current?.contains(document.activeElement)) {
        e.preventDefault();
        setIsFullscreen(f => !f);
      }
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [allowFullscreen, isFullscreen]);

  // Clean up editor on unmount
  useEffect(() => () => { editor?.destroy(); }, [editor]);

  // The editor shell — identical markup for both inline and fullscreen.
  // When fullscreen, we portal it into document.body to escape any CSS
  // transform/overflow context imposed by the sidebar layout.
  const shell = (
    <div
      ref={containerRef}
      style={{
        // Layout
        position: isFullscreen ? 'fixed' : 'relative',
        // Offset by sidebar width (16rem) so we don't overlap the sidebar.
        // top/bottom/right fill the rest of the viewport.
        top:    isFullscreen ? 0       : 'auto',
        right:  isFullscreen ? 0       : 'auto',
        bottom: isFullscreen ? 0       : 'auto',
        left:   isFullscreen ? '16rem' : 'auto',
        zIndex: isFullscreen ? 9999    : 'auto',
        display: 'flex',
        flexDirection: 'column',
        // Sizing — width auto in fullscreen (inset drives it); 100% in normal
        width:  isFullscreen ? 'auto'  : '100%',
        height: isFullscreen ? '100vh' : 'auto',
        // Appearance
        background: 'hsl(var(--surface-card))',
        border: isFullscreen ? 'none' : '1px solid rgba(255,255,255,0.1)',
        borderRadius: isFullscreen ? 0 : 12,
        boxShadow: isFullscreen ? 'none' : '0 2px 16px rgba(0,0,0,0.18)',
        overflow: 'hidden',
      }}
    >
      {/* Toolbar */}
      <Toolbar
        editor={editor}
        isFullscreen={isFullscreen}
        setFullscreen={setIsFullscreen}
        showPreview={showPreview}
        setShowPreview={setShowPreview}
        allowFullscreen={allowFullscreen}
      />

      {/* Editor + optional preview */}
      {/*
        In fullscreen: shell has height:100vh so flex:1 1 0 + minHeight:0 fills the gap.
        In normal mode: shell has height:auto so we rely on minHeight on the panes
        themselves to drive the shell's height — flex:1 1 0 would collapse to 0 otherwise.
      */}
      <div
        style={{
          display: 'flex',
          // fullscreen: fill remaining height; normal: grow with children
          ...(isFullscreen
            ? { flex: '1 1 0', minHeight: 0, overflow: 'hidden' }
            : { minHeight: minHeight }),
        }}
      >
        {/* Editor pane */}
        <div
          style={{
            flex: showPreview ? '0 0 50%' : '1 1 0',
            // In fullscreen overflow-y scrolls inside the fixed container.
            // In normal mode the pane itself drives the visible height.
            overflowY: isFullscreen ? 'auto' : 'visible',
            minHeight: isFullscreen ? 0 : minHeight,
            background: 'hsl(var(--surface-card))',
            borderRight: showPreview ? '1px solid rgba(255,255,255,0.08)' : 'none',
          }}
          onClick={() => editor?.commands.focus()}
        >
          <div className={PROSE_CLS}>
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Preview pane — real-time via liveHtml state */}
        {showPreview && (
          <div
            style={{
              flex: '0 0 50%',
              overflowY: 'auto',
              minHeight: isFullscreen ? 0 : minHeight,
              background: 'hsl(var(--background))',
              padding: '20px',
            }}
          >
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-3 select-none">
              Preview
            </div>
            {liveHtml && liveHtml !== '<p></p>' ? (
              <div
                className={`text-sm leading-relaxed ${PROSE_CLS}`}
                dangerouslySetInnerHTML={{ __html: liveHtml }}
              />
            ) : (
              <p className="text-muted-foreground/40 text-sm italic">Nothing to preview yet…</p>
            )}
          </div>
        )}
      </div>

      {/* Status bar */}
      <StatusBar
        words={wordCount}
        chars={charCount}
        isDirty={isDirty}
        lastSaved={lastSaved}
        saving={saving}
        onSave={onSave ? handleSave : undefined}
      />
    </div>
  );

  // In fullscreen: portal into document.body to break out of the sidebar's
  // CSS transform stacking context, which would otherwise confine `position:fixed`.
  if (isFullscreen && isMounted) {
    return createPortal(shell, document.body);
  }

  return shell;
}
