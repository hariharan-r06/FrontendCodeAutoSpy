import { cn } from '@/lib/utils';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  variant?: 'default' | 'added' | 'removed';
  className?: string;
}

export function CodeBlock({ code, title, variant = 'default', className }: CodeBlockProps) {
  const variantStyles = {
    default: 'border-border',
    added: 'border-success/30 bg-success/5',
    removed: 'border-destructive/30 bg-destructive/5',
  };

  return (
    <div className={cn("rounded-lg overflow-hidden", className)}>
      {title && (
        <div className="px-4 py-2 bg-background-tertiary border-b border-border text-xs font-medium text-muted-foreground">
          {title}
        </div>
      )}
      <pre className={cn(
        "code-block text-sm overflow-x-auto",
        variantStyles[variant]
      )}>
        <code className="text-foreground font-mono">{code}</code>
      </pre>
    </div>
  );
}
