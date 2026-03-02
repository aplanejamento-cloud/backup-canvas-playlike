import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import {
  Bold,
  Italic,
  Type,
  Palette,
  Minus,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
}

const COLORS = ["#ffffff", "#d4af37", "#ff4444", "#44ff44", "#4488ff", "#ff44ff", "#ffaa00"];

const RichTextEditor = ({ content, onChange }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [StarterKit, TextStyle, Color],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content]);

  if (!editor) return null;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 bg-muted/50 border-b border-border">
        <Button
          variant={editor.isActive("bold") ? "default" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive("italic") ? "default" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>

        <div className="w-px bg-border mx-1" />

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            const current = editor.getAttributes("textStyle").fontSize;
            const size = parseInt(current || "16") - 2;
            if (size >= 10) {
              editor.chain().focus().setMark("textStyle", { fontSize: `${size}px` }).run();
            }
          }}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="flex items-center text-xs text-muted-foreground px-1">
          <Type className="h-3 w-3 mr-1" />
          Tamanho
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            const current = editor.getAttributes("textStyle").fontSize;
            const size = parseInt(current || "16") + 2;
            if (size <= 48) {
              editor.chain().focus().setMark("textStyle", { fontSize: `${size}px` }).run();
            }
          }}
        >
          <Plus className="h-4 w-4" />
        </Button>

        <div className="w-px bg-border mx-1" />

        <div className="flex items-center gap-1">
          <Palette className="h-3 w-3 text-muted-foreground" />
          {COLORS.map((color) => (
            <button
              key={color}
              className="h-6 w-6 rounded border border-border hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              onClick={() => editor.chain().focus().setColor(color).run()}
            />
          ))}
        </div>
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className="prose prose-invert max-w-none p-4 min-h-[120px] focus-within:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[100px]"
      />
    </div>
  );
};

export default RichTextEditor;
