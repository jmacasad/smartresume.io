import React from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * Wraps ReactMarkdown and coerces any non-string children
 * into a JSON string, so you never hit "replace is not a function."
 */
export default function SafeMarkdown({ children, ...props }) {
  // If children is already a string, use it; otherwise serialize it
  const content = typeof children === 'string'
    ? children
    : JSON.stringify(children);

  return (
    <ReactMarkdown {...props}>
      {content}
    </ReactMarkdown>
  );
}
