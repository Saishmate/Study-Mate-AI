import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useGetNote, getGetNoteQueryKey, useGenerateFlashcards, useSaveContent, getListSavedQueryKey } from "@workspace/api-client-react";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Brain, Loader2, Save, CheckCircle2, ChevronRight, ChevronLeft, RotateCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function NoteFlashcards() {
  const params = useParams();
  const noteId = params.noteId ? parseInt(params.noteId) : 0;
  
  const { data: note, isLoading: noteLoading } = useGetNote(noteId, { 
    query: { enabled: !!noteId, queryKey: getGetNoteQueryKey(noteId) } 
  });
  
  const generateFlashcardsMutation = useGenerateFlashcards();
  const saveContentMutation = useSaveContent();
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (note && flashcards.length === 0 && !generateFlashcardsMutation.isPending && !generateFlashcardsMutation.isSuccess) {
      generateFlashcardsMutation.mutate(
        { noteId },
        {
          onSuccess: (data) => setFlashcards(data),
          onError: () => {
            toast({
              variant: "destructive",
              title: "Generation failed",
              description: "Failed to generate flashcards.",
            });
          }
        }
      );
    }
  }, [note, noteId, generateFlashcardsMutation, flashcards.length, toast]);

  const handleSave = () => {
    if (flashcards.length === 0 || !note) return;
    
    saveContentMutation.mutate(
      { 
        data: {
          noteId,
          type: "flashcards",
          title: `${note.title} - Flashcards`,
          content: JSON.stringify(flashcards)
        }
      },
      {
        onSuccess: () => {
          setIsSaved(true);
          queryClient.invalidateQueries({ queryKey: getListSavedQueryKey() });
          toast({
            title: "Saved successfully",
            description: "Flashcards added to your saved content.",
          });
        }
      }
    );
  };

  const nextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev - 1), 150);
    }
  };

  const isGenerating = noteLoading || generateFlashcardsMutation.isPending;

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
              <h1 className="text-2xl font-bold tracking-tight">Flashcards</h1>
              {note && <p className="text-muted-foreground text-sm">For: {note.title}</p>}
            </div>
          </div>
          {flashcards.length > 0 && (
            <Button 
              variant={isSaved ? "secondary" : "default"} 
              onClick={handleSave}
              disabled={isSaved || saveContentMutation.isPending}
              data-testid="button-save-flashcards"
            >
              {saveContentMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : isSaved ? (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isSaved ? "Saved" : "Save Deck"}
            </Button>
          )}
        </div>

        {isGenerating ? (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col items-center justify-center py-24 text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                <Brain className="w-12 h-12 text-primary animate-pulse relative z-10" />
              </div>
              <h3 className="text-xl font-bold mb-2">Creating flashcards...</h3>
              <p className="text-muted-foreground max-w-sm">
                Extracting important facts, definitions, and concepts to build your spaced repetition deck.
              </p>
              <div className="mt-8 flex gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </CardContent>
          </Card>
        ) : flashcards.length > 0 ? (
          <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl mx-auto flex flex-col items-center">
            
            <div className="w-full flex justify-between items-center text-sm font-medium text-muted-foreground px-2">
              <span>Card {currentIndex + 1} of {flashcards.length}</span>
              {flashcards[currentIndex].topic && (
                <span className="px-2 py-1 bg-muted rounded-md">{flashcards[currentIndex].topic}</span>
              )}
            </div>

            {/* Flashcard Component */}
            <div 
              className="w-full h-80 sm:h-96 relative cursor-pointer perspective-1000" 
              onClick={() => setIsFlipped(!isFlipped)}
              data-testid="flashcard-container"
            >
              <div 
                className={`w-full h-full transition-all duration-500 transform-style-3d relative ${isFlipped ? 'rotate-y-180' : ''}`}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Front */}
                <Card className="absolute inset-0 w-full h-full backface-hidden shadow-md border-2" style={{ backfaceVisibility: 'hidden' }}>
                  <CardContent className="h-full flex flex-col items-center justify-center p-8 text-center relative">
                    <span className="absolute top-4 left-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Front</span>
                    <h3 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                      {flashcards[currentIndex].front}
                    </h3>
                    <div className="absolute bottom-6 flex items-center text-muted-foreground text-sm gap-2">
                      <RotateCw className="w-4 h-4" />
                      Click to flip
                    </div>
                  </CardContent>
                </Card>

                {/* Back */}
                <Card className="absolute inset-0 w-full h-full backface-hidden shadow-md border-2 border-primary/20 bg-primary/5" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                  <CardContent className="h-full flex flex-col items-center justify-center p-8 text-center relative">
                    <span className="absolute top-4 left-4 text-xs font-bold uppercase tracking-wider text-primary">Back</span>
                    <div className="text-xl sm:text-2xl text-foreground leading-relaxed">
                      {flashcards[currentIndex].back}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 mt-8 w-full justify-center">
              <Button 
                variant="outline" 
                size="lg" 
                onClick={prevCard} 
                disabled={currentIndex === 0}
                className="w-32"
                data-testid="button-prev-card"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Previous
              </Button>
              <Button 
                variant="default" 
                size="lg" 
                onClick={nextCard} 
                disabled={currentIndex === flashcards.length - 1}
                className="w-32"
                data-testid="button-next-card"
              >
                Next
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
