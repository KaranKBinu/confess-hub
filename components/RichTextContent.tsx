import { renderRichText } from "@/lib/richText";

type RichTextContentProps = {
  content: string;
  className?: string;
};

export default function RichTextContent({ content, className = "rich-text" }: RichTextContentProps) {
  return <div className={className}>{renderRichText(content)}</div>;
}