import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useGetNote, getGetNoteQueryKey, useGenerateSummary, useSaveContent, getListSavedQueryKey } from "@workspace/api-client-react";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Loader2, Save, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function NoteSummary() {
  const params = useParams();
  const noteId = params.noteId ? parseInt(params.noteId) : 0;

  const { data: note, isLoading: noteLoading } = useGetNote(noteId, {
    query: { enabled: !!noteId, queryKey: getGetNoteQueryKey(noteId) },
  });

  const generateSummaryMutation = useGenerateSummary();
  const saveContentMutation = useSaveContent();
  const [summaryData, setSummaryData] = useState<{ summary: string; keyPoints: string[] } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Guard: fire the mutation exactly once when the note is loaded
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (!note || hasTriggered.current) return;
    hasTriggered.current = true;

    generateSummaryMutation.mutate(
      { noteId },
      {
        onSuccess: (data) => setSummaryData(data),
        onError: (err: unknown) => {
          const msg =
            (err as { data?: { error?: string } })?.data?.error ??
            "Failed to generate summary. Please try again.";
          setErrorMsg(msg);
          toast({ variant: "destructive", title: "Generation failed", description: msg });
        },
      }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note]);

  const handleSave = () => {
    if (!summaryData || !note) return;
    saveContentMutation.mutate(
      {
        data: {
          noteId,
          type: "summary",
          title: `${note.title} - Summary`,
          content: JSON.stringify(summaryData),
        },
      },
      {
        onSuccess: () => {
          setIsSaved(true);
          queryClient.invalidateQueries({ queryKey: getListSavedQueryKey() });
          toast({ title: "Saved successfully", description: "Summary added to your saved content." });
        },
      }
    );
  };

  const isGenerating = noteLoading || generateSummaryMutation.isPending;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href={`/notes/${noteId}`}>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">AI Summary</h1>
              {note && <p className="text-muted-foreground text-sm">For: {note.title}</p>}
            </div>
          </div>
          {summaryData && (
            <Button
              variant={isSaved ? "secondary" : "default"}
              onClick={handleSave}
              disabled={isSaved || saveContentMutation.isPending}
              data-testid="button-save-summary"
            >
              {saveContentMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : isSaved ? (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isSaved ? "Saved" : "Save Summary"}
            </Button>
          )}
        </div>

        {isGenerating ? (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col items-center justify-center py-24 text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                <Sparkles className="w-12 h-12 text-primary animate-pulse relative z-10" />
              </div>
              <h3 className="text-xl font-bold mb-2">Analyzing your notes...</h3>
              <p className="text-muted-foreground max-w-sm">
                Gemini is reading your material and generating a concise summary.
              </p>
              <div className="mt-8 flex gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </CardContent>
          </Card>
        ) : errorMsg ? (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
              <p className="text-destructive font-medium">{errorMsg}</p>
              <Button
                variant="outline"
                onClick={() => {
                  setErrorMsg(null);
                  hasTriggered.current = false;
                  if (note) {
                    hasTriggered.current = true;
                    generateSummaryMutation.mutate(
                      { noteId },
                      {
                        onSuccess: (data) => setSummaryData(data),
                        onError: (err: unknown) => {
                          const msg =
                            (err as { data?: { error?: string } })?.data?.error ??
                            "Failed to generate summary. Please try again.";
                          setErrorMsg(msg);
                        },
                      }
                    );
                  }
                }}
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : summaryData ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card>
              <CardContent className="p-8">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Core Summary</h3>
                <div className="text-lg leading-relaxed text-foreground">{summaryData.summary}</div>
              </CardContent>
            </Card>

            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Key Points
              </h3>
              <div className="grid gap-3">
                {summaryData.keyPoints?.map((point: string, index: number) => (
                  <Card key={index} className="border-l-4 border-l-primary">
                    <CardContent className="p-4 flex items-start gap-4">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <p className="text-foreground/90">{point}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
