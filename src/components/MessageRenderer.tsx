import React from 'react';

interface MessageRendererProps {
  content: string;
}

const MessageRenderer: React.FC<MessageRendererProps> = ({ content }) => {
  // Parse markdown-style links [text](url)
  const parseContent = (text: string) => {
    const parts: (string | React.ReactElement)[] = [];
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      // Add the clickable link
      const [, linkText, url] = match;
      parts.push(
        <a
          key={match.index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="blockchain-link"
          style={{
            color: '#007bff',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          {linkText}
        </a>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  // Parse contract addresses and transaction hashes to make them clickable
  const parseBlockchainData = (text: string) => {
    // Match transaction hashes and contract addresses (0x followed by 40-66 hex chars)
    const addressRegex = /(`0x[a-fA-F0-9]{40,66}`)/g;
    
    return text.replace(addressRegex, (match) => {
      const cleanAddress = match.replace(/`/g, ''); // Remove backticks
      const explorerUrl = `https://opbnbscan.com/address/${cleanAddress}`;
      const shortAddress = `${cleanAddress.slice(0, 10)}...${cleanAddress.slice(-8)}`;
      return `[${shortAddress}](${explorerUrl})`;
    });
  };

  const renderLine = (line: string, index: number) => {
    // First parse blockchain data to convert addresses to links
    const processedLine = parseBlockchainData(line);
    
    // Then parse all markdown links
    const parsedContent = parseContent(processedLine);
    
    return (
      <p key={index} style={{ margin: '0.5em 0', lineHeight: '1.5' }}>
        {parsedContent.length > 0 ? parsedContent : line}
      </p>
    );
  };

  return (
    <>
      {content.split('\n').map(renderLine)}
    </>
  );
};

export default MessageRenderer;
