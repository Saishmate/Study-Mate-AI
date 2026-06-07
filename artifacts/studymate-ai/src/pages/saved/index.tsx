import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useListSaved, useDeleteSaved, getListSavedQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bookmark, Trash2, LayoutTemplate, Brain, PenTool, ExternalLink } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function SavedContent() {
  const { data: savedItems, isLoading } = useListSaved();
  const deleteSavedMutation = useDeleteSaved();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = (id: number) => {
    deleteSavedMutation.mutate({ savedId: id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSavedQueryKey() });
        toast({
          title: "Removed",
          description: "Item removed from saved content.",
        });
      }
    });
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "summary": return <LayoutTemplate className="w-5 h-5 text-indigo-500" />;
      case "flashcards": return <Brain className="w-5 h-5 text-purple-500" />;
      case "quiz": return <PenTool className="w-5 h-5 text-blue-500" />;
      default: return <Bookmark className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Saved Content</h1>
          <p className="text-muted-foreground mt-1">Access your generated summaries, flashcards, and quizzes.</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-10 bg-muted rounded w-full"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : savedItems && savedItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedItems.map(item => (
              <Card key={item.id} className="h-full flex flex-col hover:border-primary/30 transition-colors" data-testid={`card-saved-${item.id}`}>
                <CardHeader className="pb-3 flex-1">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 shrink-0 p-2 rounded-lg bg-muted/50 border">
                        {getIconForType(item.type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg leading-tight line-clamp-2">{item.title}</CardTitle>
                        <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mt-1 block">
                          {item.type}
                        </span>
                      </div>
                    </div>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0 -mr-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove saved item?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove the item from your saved list. You can always regenerate it from the original note.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => handleDelete(item.id)}
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 border-t border-border/40 mt-auto flex justify-between items-center bg-muted/20">
                  <span className="text-xs text-muted-foreground">
                    Saved {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                  <Link href={`/notes/${item.noteId}/${item.type}`}>
                    <Button variant="secondary" size="sm" className="h-8 gap-1" data-testid={`button-view-saved-${item.id}`}>
                      View <ExternalLink className="w-3 h-3" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card border border-dashed rounded-xl">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Bookmark className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium mb-2">No saved content</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              When you generate summaries, flashcards, or quizzes, you can save them here for quick access later.
            </p>
            <Link href="/notes">
              <Button>
                Go to Notes
              </Button>
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
