import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useGetNote, getGetNoteQueryKey } from "@workspace/api-client-react";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Brain, PenTool, LayoutTemplate, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function NoteDetail() {
  const params = useParams();
  const noteId = params.noteId ? parseInt(params.noteId) : 0;
  
  const { data: note, isLoading } = useGetNote(noteId, { 
    query: { enabled: !!noteId, queryKey: getGetNoteQueryKey(noteId) } 
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-muted rounded-full"></div>
            <div className="space-y-2">
              <div className="h-8 bg-muted rounded w-64"></div>
              <div className="h-4 bg-muted rounded w-32"></div>
            </div>
          </div>
          <div className="h-40 bg-muted rounded-xl"></div>
          <div className="h-96 bg-muted rounded-xl"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!note) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold">Note not found</h2>
          <Link href="/notes">
            <Button variant="link" className="mt-4">Return to Notes</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href="/notes">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{note.title}</h1>
              {note.subject && (
                <span className="px-2.5 py-1 rounded-md text-xs bg-muted font-medium text-muted-foreground">
                  {note.subject}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>Uploaded {new Date(note.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* AI Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href={`/notes/${noteId}/summary`}>
            <Card className="hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer" data-testid="card-action-summary">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <LayoutTemplate className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Generate Summary</h3>
                  <p className="text-xs text-muted-foreground">Distill key concepts</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href={`/notes/${noteId}/flashcards`}>
            <Card className="hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer" data-testid="card-action-flashcards">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Brain className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Flashcards</h3>
                  <p className="text-xs text-muted-foreground">Spaced repetition deck</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href={`/notes/${noteId}/quiz`}>
            <Card className="hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer" data-testid="card-action-quiz">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <PenTool className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Practice Quiz</h3>
                  <p className="text-xs text-muted-foreground">Test your knowledge</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
          <div className="border-b bg-muted/30 px-6 py-3 font-medium text-sm text-muted-foreground flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Original Note Content
          </div>
          <div className="p-6 md:p-8 font-serif leading-relaxed whitespace-pre-wrap text-foreground/90">
            {note.content}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function FileText({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  );
}
