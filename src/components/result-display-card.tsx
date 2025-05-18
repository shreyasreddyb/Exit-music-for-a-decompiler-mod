"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface ResultDisplayCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
  isLoading?: boolean;
  actionButton?: ReactNode;
  minHeight?: string; // e.g. "200px" or "h-64"
  placeholderText?: string;
}

const ResultDisplayCard: React.FC<ResultDisplayCardProps> = ({
  title,
  description,
  icon: Icon,
  children,
  isLoading,
  actionButton,
  minHeight = "200px",
  placeholderText = "Results will appear here.",
}) => {
  const hasContent = children !== null && children !== undefined && (typeof children !== 'object' || Object.keys(children).length > 0);

  return (
    <Card className="flex flex-col h-full shadow-lg">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex-grow">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5 text-accent" />}
            <CardTitle className="text-xl font-semibold text-primary">{title}</CardTitle>
          </div>
          {description && <CardDescription className="mt-1 text-sm">{description}</CardDescription>}
        </div>
        {actionButton}
      </CardHeader>
      <CardContent className="pt-2 flex-grow overflow-hidden" style={{ minHeight }}>
        <ScrollArea className="h-full pr-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <p className="ml-2 text-muted-foreground">Loading...</p>
            </div>
          ) : (
            hasContent ? children : <p className="text-muted-foreground italic p-4 text-center">{placeholderText}</p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ResultDisplayCard;
