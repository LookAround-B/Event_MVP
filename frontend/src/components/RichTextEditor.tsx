import React, { useCallback, useEffect, useRef } from 'react';
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
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import {
  Bold, Italic, Underline as UnderlineIcon, List, AlignLeft, AlignCenter,
  AlignRight, AlignJustify, Link2, Code, Minus, RotateCcw,
  RotateCw, Type,
} from 'lucide-react';
import {
  RiStrikethrough, RiSubscript, RiSuperscript, RiH1, RiH2, RiH3,
  RiListOrdered, RiDoubleQuotesL, RiFormatClear, RiTableLine,
  RiMarkPenLine, RiCodeBoxLine, RiSeparator,
} from 'react-icons/ri';

interface RichTextEditorProps {
  value: string;
  onChange: (data: string) => void;
  placeholder?: string;
}

// Toolbar button component
function TBtn({ onClick, active, disabled, title, children }: {
  onClick: () => void; active?: boolean; disabled?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded transition-colors duration-150 ${
        active
          ? 'text-[hsl(var(--primary))]'
          : 'hover:bg-[hsl(var(--surface-container))]'
      } ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
      style={active ? { background: 'hsl(var(--primary) / 0.15)' } : { color: 'hsl(var(--muted-foreground))' }}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <div className="w-px h-5 mx-1 self-center" style={{ background: 'hsl(var(--border) / 0.3)' }} />;
}

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> | null }) {
  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', prev || 'https://');
    if (url === null) return;
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-2 rounded-t-lg" style={{ borderBottom: '1px solid hsl(var(--border) / 0.3)', background: 'hsl(var(--surface-container))' }}>
      {/* Undo / Redo */}
      <TBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
        <RotateCcw size={15} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
        <RotateCw size={15} />
      </TBtn>

      <Separator />

      {/* Headings */}
      <TBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
        <RiH1 size={16} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
        <RiH2 size={16} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
        <RiH3 size={16} />
      </TBtn>

      <Separator />

      {/* Font Family */}
      <select
        onChange={(e) => {
          if (e.target.value === '') editor.chain().focus().unsetFontFamily().run();
          else editor.chain().focus().setFontFamily(e.target.value).run();
        }}
        value={editor.getAttributes('textStyle').fontFamily || ''}
        title="Font Family"
        className="text-xs rounded px-1.5 py-1 outline-none cursor-pointer"
        style={{ background: 'hsl(var(--surface-container))', border: '1px solid hsl(var(--border) / 0.3)', color: 'hsl(var(--on-surface-variant))' }}
      >
        <option value="">Default</option>
        <option value="Arial, sans-serif">Arial</option>
        <option value="Georgia, serif">Georgia</option>
        <option value="Times New Roman, serif">Times</option>
        <option value="Courier New, monospace">Courier</option>
        <option value="Verdana, sans-serif">Verdana</option>
      </select>

      {/* Font Color */}
      <div className="relative" title="Text Color">
        <input
          type="color"
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          value={editor.getAttributes('textStyle').color || '#e2e8f0'}
          className="w-6 h-6 rounded cursor-pointer bg-transparent"
          style={{ border: '1px solid hsl(var(--border) / 0.3)' }}
        />
      </div>

      <Separator />

      {/* Text Formatting */}
      <TBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
        <Bold size={15} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
        <Italic size={15} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
        <UnderlineIcon size={15} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
        <RiStrikethrough size={15} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive('subscript')} title="Subscript">
        <RiSubscript size={15} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')} title="Superscript">
        <RiSuperscript size={15} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight">
        <RiMarkPenLine size={15} />
      </TBtn>

      <Separator />

      {/* Alignment */}
      <TBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left">
        <AlignLeft size={15} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Center">
        <AlignCenter size={15} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right">
        <AlignRight size={15} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify">
        <AlignJustify size={15} />
      </TBtn>

      <Separator />

      {/* Lists */}
      <TBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
        <List size={15} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered List">
        <RiListOrdered size={15} />
      </TBtn>

      <Separator />

      {/* Block Elements */}
      <TBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
        <RiDoubleQuotesL size={15} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block">
        <RiCodeBoxLine size={15} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline Code">
        <Code size={15} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
        <RiSeparator size={15} />
      </TBtn>

      <Separator />

      {/* Link & Table */}
      <TBtn onClick={setLink} active={editor.isActive('link')} title="Insert Link">
        <Link2 size={15} />
      </TBtn>
      <TBtn onClick={addTable} title="Insert Table">
        <RiTableLine size={15} />
      </TBtn>

      <Separator />

      {/* Clear Formatting */}
      <TBtn onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Clear Formatting">
        <RiFormatClear size={15} />
      </TBtn>
    </div>
  );
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const isInternalUpdate = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      UnderlineExt,
      TextStyle,
      Color,
      FontFamily,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false, autolink: true }),
      Subscript,
      Superscript,
      Placeholder.configure({ placeholder: placeholder || 'Start typing...' }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      HorizontalRule,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      isInternalUpdate.current = true;
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none min-h-[200px] px-4 py-3 outline-none focus:outline-none',
        style: 'color: hsl(var(--on-surface)); cursor: text;',
      },
    },
  });

  // Sync external value changes into the editor (e.g. when loading data)
  useEffect(() => {
    if (editor && !isInternalUpdate.current && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
    isInternalUpdate.current = false;
  }, [value, editor]);

  return (
    <div
      className="rounded-lg overflow-hidden transition-all"
      style={{ border: '1px solid hsl(var(--border) / 0.5)', background: 'hsl(var(--surface-card))' }}
      onClick={() => editor?.chain().focus().run()}
    >
      <Toolbar editor={editor} />
      <div className="[&_.tiptap]:min-h-[200px] [&_.tiptap]:px-4 [&_.tiptap]:py-3 [&_.tiptap]:outline-none [&_.tiptap.ProseMirror-focused]:outline-none [&_.tiptap_p.is-editor-empty:first-child::before]:text-[hsl(var(--muted-foreground))] [&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.tiptap_p.is-editor-empty:first-child::before]:float-left [&_.tiptap_p.is-editor-empty:first-child::before]:h-0 [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}