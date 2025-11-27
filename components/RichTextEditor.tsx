"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { useState, useEffect } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * A WYSIWYG rich text editor using TipTap
 * Supports: bold, italic, underline, lists, links, headings, and more
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter text...",
}: RichTextEditorProps) {
  const [isClient, setIsClient] = useState(false);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          paragraph: {
            HTMLAttributes: {
              class: "text-base",
            },
          },
          heading: {
            HTMLAttributes: {
              class: "font-bold",
            },
          },
          bulletList: {
            HTMLAttributes: {
              class: "list-disc list-inside",
            },
          },
          orderedList: {
            HTMLAttributes: {
              class: "list-decimal list-inside",
            },
          },
        }),
        Link.configure({
          openOnClick: true,
          HTMLAttributes: {
            class: "text-blue-600 underline",
          },
        }),
      ],
      content: value,
      immediatelyRender: false,
      onUpdate: ({ editor }) => {
        onChange(editor.getHTML());
      },
      editorProps: {
        attributes: {
          class:
            "w-full min-h-48 p-4 text-base text-gray-900 outline-none bg-white prose prose-sm max-w-none focus:outline-none",
          dir: "ltr",
          style: "direction: ltr; text-align: left; unicode-bidi: bidi-override;",
        },
      },
    },
    [isClient]
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (editor && value && editor.getHTML() !== value) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  if (!isClient || !editor) {
    return (
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-300 p-4">
          <div className="w-full min-h-48 bg-white rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const toggleBold = () => editor.chain().focus().toggleBold().run();
  const toggleItalic = () => editor.chain().focus().toggleItalic().run();
  const toggleUnderline = () => editor.chain().focus().toggleUnderline().run();
  const toggleBulletList = () => editor.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () => editor.chain().focus().toggleOrderedList().run();
  const toggleHeading1 = () => editor.chain().focus().toggleHeading({ level: 1 }).run();
  const toggleHeading2 = () => editor.chain().focus().toggleHeading({ level: 2 }).run();
  const toggleCodeBlock = () => editor.chain().focus().toggleCodeBlock().run();
  const addLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  };
  const clearFormatting = () => editor.chain().focus().clearNodes().unsetAllMarks().run();

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={toggleBold}
          className={`px-3 py-1 rounded text-sm font-medium transition ${
            editor.isActive("bold")
              ? "bg-blue-600 text-white"
              : "bg-white border border-gray-300 hover:bg-gray-100"
          }`}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={toggleItalic}
          className={`px-3 py-1 rounded text-sm font-medium transition ${
            editor.isActive("italic")
              ? "bg-blue-600 text-white"
              : "bg-white border border-gray-300 hover:bg-gray-100"
          }`}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={toggleUnderline}
          className={`px-3 py-1 rounded text-sm font-medium transition ${
            editor.isActive("underline")
              ? "bg-blue-600 text-white"
              : "bg-white border border-gray-300 hover:bg-gray-100"
          }`}
          title="Underline (Ctrl+U)"
        >
          <u>U</u>
        </button>
        <div className="border-l border-gray-300 mx-1" />
        <button
          type="button"
          onClick={toggleHeading1}
          className={`px-3 py-1 rounded text-sm font-medium transition ${
            editor.isActive("heading", { level: 1 })
              ? "bg-blue-600 text-white"
              : "bg-white border border-gray-300 hover:bg-gray-100"
          }`}
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={toggleHeading2}
          className={`px-3 py-1 rounded text-sm font-medium transition ${
            editor.isActive("heading", { level: 2 })
              ? "bg-blue-600 text-white"
              : "bg-white border border-gray-300 hover:bg-gray-100"
          }`}
          title="Heading 2"
        >
          H2
        </button>
        <div className="border-l border-gray-300 mx-1" />
        <button
          type="button"
          onClick={toggleBulletList}
          className={`px-3 py-1 rounded text-sm font-medium transition ${
            editor.isActive("bulletList")
              ? "bg-blue-600 text-white"
              : "bg-white border border-gray-300 hover:bg-gray-100"
          }`}
          title="Bullet List"
        >
          • List
        </button>
        <button
          type="button"
          onClick={toggleOrderedList}
          className={`px-3 py-1 rounded text-sm font-medium transition ${
            editor.isActive("orderedList")
              ? "bg-blue-600 text-white"
              : "bg-white border border-gray-300 hover:bg-gray-100"
          }`}
          title="Numbered List"
        >
          1. List
        </button>
        <div className="border-l border-gray-300 mx-1" />
        <button
          type="button"
          onClick={addLink}
          className={`px-3 py-1 rounded text-sm font-medium transition ${
            editor.isActive("link")
              ? "bg-blue-600 text-white"
              : "bg-white border border-gray-300 hover:bg-gray-100"
          }`}
          title="Add Link"
        >
          🔗 Link
        </button>
        <button
          type="button"
          onClick={toggleCodeBlock}
          className={`px-3 py-1 rounded text-sm font-medium transition ${
            editor.isActive("codeBlock")
              ? "bg-blue-600 text-white"
              : "bg-white border border-gray-300 hover:bg-gray-100"
          }`}
          title="Code Block"
        >
          {`</>`}
        </button>
        <button
          type="button"
          onClick={clearFormatting}
          className="px-3 py-1 bg-white border border-gray-300 rounded text-sm font-medium hover:bg-gray-100 transition"
          title="Clear Formatting"
        >
          Clear
        </button>
      </div>
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none"
      />
    </div>
  );
}
