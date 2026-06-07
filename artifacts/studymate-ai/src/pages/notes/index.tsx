import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useListNotes, useDeleteNote, getListNotesQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { FileText, PlusCircle, Search, Trash2, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
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

export default function NotesList() {
  const { data: notes, isLoading } = useListNotes();
  const [search, setSearch] = useState("");
  const deleteNoteMutation = useDeleteNote();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const filteredNotes = notes?.filter(note => 
    note.title.toLowerCase().includes(search.toLowerCase()) || 
    (note.subject && note.subject.toLowerCase().includes(search.toLowerCase()))
  ) || [];

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.preventDefault(); // Prevent navigating to note details
    e.stopPropagation();
    
    deleteNoteMutation.mutate({ noteId: id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
        toast({
          title: "Note deleted",
          description: "Your note has been successfully deleted.",
        });
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Failed to delete",
          description: "An error occurred while deleting the note.",
        });
      }
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Notes</h1>
            <p className="text-muted-foreground mt-1">Manage all your study materials.</p>
          </div>
          <Link href="/notes/new">
            <Button data-testid="button-new-note">
              <PlusCircle className="w-4 h-4 mr-2" />
              Upload Note
            </Button>
          </Link>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search notes by title or subject..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-notes"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-16 bg-muted rounded w-full"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredNotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map(note => (
              <Link href={`/notes/${note.id}`} key={note.id}>
                <Card className="h-full flex flex-col hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group" data-testid={`card-note-${note.id}`}>
                  <CardHeader className="pb-3 flex-1">
                    <div className="flex justify-between items-start gap-4">
                      <CardTitle className="text-xl line-clamp-2 leading-tight group-hover:text-primary transition-colors">{note.title}</CardTitle>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0 -mt-1 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                            data-testid={`button-delete-note-${note.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this note?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your note and all associated generated content.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={(e) => handleDelete(e, note.id)}
                            >
                              Delete Note
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    {note.subject && (
                      <div className="inline-block px-2 py-1 rounded text-xs bg-muted font-medium text-muted-foreground mt-2 w-max">
                        {note.subject}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="pb-4">
                    <p className="text-muted-foreground text-sm line-clamp-3">
                      {note.content.substring(0, 150)}...
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0 pb-4 border-t border-border/40 mt-auto pt-4 flex items-center text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                    {new Date(note.createdAt).toLocaleDateString()}
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card border border-dashed rounded-xl">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium mb-2">No notes found</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              {search ? "No notes match your search criteria. Try a different term." : "You haven't uploaded any notes yet. Create your first note to start generating study materials."}
            </p>
            {!search && (
              <Link href="/notes/new">
                <Button>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Upload First Note
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
