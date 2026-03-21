"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

type ToolbarButtonProps = {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
};

function ToolbarBtn({ onClick, active, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors ${
        active
          ? "bg-accent text-white"
          : "text-gray-500 hover:bg-gray-100 hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}

export default function TiptapEditor({ value, onChange, placeholder }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-accent underline" } }),
      Placeholder.configure({ placeholder: placeholder ?? "Rédigez votre contenu ici…" }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[320px] px-4 py-3 focus:outline-none text-gray-700 leading-relaxed",
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  // Sync external value changes (e.g. when switching between posts)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false, { preserveWhitespace: "full" });
    }
  }, [value, editor]);

  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt("URL du lien :", "https://");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:border-accent transition-colors">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 bg-gray-50 border-b border-gray-200">
        {/* Headings */}
        <ToolbarBtn
          title="Titre H2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </ToolbarBtn>
        <ToolbarBtn
          title="Titre H3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </ToolbarBtn>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Inline styles */}
        <ToolbarBtn title="Gras" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <strong>G</strong>
        </ToolbarBtn>
        <ToolbarBtn title="Italique" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <em>I</em>
        </ToolbarBtn>
        <ToolbarBtn title="Souligné" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <span className="underline">S</span>
        </ToolbarBtn>
        <ToolbarBtn title="Barré" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <span className="line-through">B</span>
        </ToolbarBtn>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Lists */}
        <ToolbarBtn title="Liste à puces" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <i className="fas fa-list-ul text-xs" />
        </ToolbarBtn>
        <ToolbarBtn title="Liste numérotée" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <i className="fas fa-list-ol text-xs" />
        </ToolbarBtn>
        <ToolbarBtn title="Citation" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <i className="fas fa-quote-left text-xs" />
        </ToolbarBtn>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Alignment */}
        <ToolbarBtn title="Aligner à gauche" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          <i className="fas fa-align-left text-xs" />
        </ToolbarBtn>
        <ToolbarBtn title="Centrer" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          <i className="fas fa-align-center text-xs" />
        </ToolbarBtn>
        <ToolbarBtn title="Aligner à droite" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          <i className="fas fa-align-right text-xs" />
        </ToolbarBtn>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Link */}
        <ToolbarBtn title="Insérer un lien" active={editor.isActive("link")} onClick={addLink}>
          <i className="fas fa-link text-xs" />
        </ToolbarBtn>
        {editor.isActive("link") && (
          <ToolbarBtn title="Supprimer le lien" onClick={() => editor.chain().focus().unsetLink().run()}>
            <i className="fas fa-link-slash text-xs" />
          </ToolbarBtn>
        )}

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* History */}
        <ToolbarBtn title="Annuler" onClick={() => editor.chain().focus().undo().run()}>
          <i className="fas fa-rotate-left text-xs" />
        </ToolbarBtn>
        <ToolbarBtn title="Rétablir" onClick={() => editor.chain().focus().redo().run()}>
          <i className="fas fa-rotate-right text-xs" />
        </ToolbarBtn>
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />
    </div>
  );
}
