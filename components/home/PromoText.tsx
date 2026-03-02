interface PromoTextProps {
  html: string;
}

const PromoText = ({ html }: PromoTextProps) => {
  // Preserve \n\n as paragraph breaks
  const processedHtml = html
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');
  const wrappedHtml = `<p>${processedHtml}</p>`;

  return (
    <div
      className="prose prose-invert max-w-none text-center [&_p]:text-foreground [&_strong]:text-primary [&_p]:mb-3"
      dangerouslySetInnerHTML={{ __html: wrappedHtml }}
    />
  );
};

export default PromoText;
