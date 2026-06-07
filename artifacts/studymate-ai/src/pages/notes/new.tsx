import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useCreateNote, getListNotesQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";

const noteSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  subject: z.string().optional(),
  content: z.string().min(10, "Content must be at least 10 characters").max(50000),
});

type NoteFormValues = z.infer<typeof noteSchema>;

export default function NewNote() {
  const createNoteMutation = useCreateNote();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: "",
      subject: "",
      content: "",
    },
  });

  const onSubmit = (data: NoteFormValues) => {
    createNoteMutation.mutate(
      { data },
      {
        onSuccess: (result) => {
          queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
          toast({
            title: "Note created",
            description: "Your note has been successfully saved.",
          });
          setLocation(`/notes/${result.id}`);
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Failed to create note",
            description: "An error occurred while saving your note.",
          });
        },
      }
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href="/notes">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Upload New Note</h1>
            <p className="text-muted-foreground">Paste your lecture notes or study material here.</p>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6 md:p-8 shadow-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Intro to Cellular Biology" {...field} data-testid="input-note-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Biology 101" {...field} data-testid="input-note-subject" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Paste your lecture notes here..." 
                        className="min-h-[300px] resize-y font-mono text-sm"
                        {...field} 
                        data-testid="input-note-content"
                      />
                    </FormControl>
                    <FormDescription>
                      The better and more detailed your notes, the better the AI generated materials will be.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  size="lg"
                  disabled={createNoteMutation.isPending}
                  data-testid="button-submit-note"
                >
                  {createNoteMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save & Continue"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </DashboardLayout>
  );
}
