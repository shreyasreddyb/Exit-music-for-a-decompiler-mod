import type { FC, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CodeBlockProps extends HTMLAttributes<HTMLPreElement> {
  code: string;
  language?: string;
}

const CodeBlock: FC<CodeBlockProps> = ({ code, language, className, ...props }) => {
  return (
    <pre
      className={cn(
        'bg-background/50 p-4 rounded-md overflow-x-auto text-sm font-mono text-foreground whitespace-pre-wrap break-words shadow-inner border border-border',
        className
      )}
      {...props}
    >
      <code>{code}</code>
    </pre>
  );
};

export default CodeBlock;
