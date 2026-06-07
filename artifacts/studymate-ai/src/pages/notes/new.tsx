import { useState, useCallback, useRef } from "react";
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
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Upload, FileText, X, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const noteSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  subject: z.string().optional(),
  content: z.string().min(10, "Content must be at least 10 characters").max(100000),
});

type NoteFormValues = z.infer<typeof noteSchema>;

type InputMode = "paste" | "pdf";

interface PdfState {
  fileName: string;
  pageCount: number;
}

export default function NewNote() {
  const createNoteMutation = useCreateNote();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { token } = useAuth();

  const [inputMode, setInputMode] = useState<InputMode>("paste");
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [pdfState, setPdfState] = useState<PdfState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: "",
      subject: "",
      content: "",
    },
  });

  const extractPdf = useCallback(
    async (file: File) => {
      if (file.type !== "application/pdf") {
        toast({ variant: "destructive", title: "Invalid file", description: "Please upload a PDF file." });
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast({ variant: "destructive", title: "File too large", description: "PDF must be under 20 MB." });
        return;
      }

      setIsExtracting(true);
      setPdfState(null);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/pdf/extract", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Extraction failed" }));
          throw new Error(err.error ?? "Extraction failed");
        }

        const data: { text: string; pageCount: number; fileName: string } = await res.json();

        form.setValue("content", data.text, { shouldValidate: true });
        setPdfState({ fileName: file.name, pageCount: data.pageCount });

        if (!form.getValues("title")) {
          const nameWithoutExt = file.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " ");
          form.setValue("title", nameWithoutExt, { shouldValidate: true });
        }

        toast({
          title: "PDF extracted",
          description: `${data.pageCount} page${data.pageCount !== 1 ? "s" : ""} extracted successfully.`,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not read the PDF.";
        toast({ variant: "destructive", title: "Extraction failed", description: message });
      } finally {
        setIsExtracting(false);
      }
    },
    [token, form, toast]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) extractPdf(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) extractPdf(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const clearPdf = () => {
    setPdfState(null);
    form.setValue("content", "", { shouldValidate: false });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = (data: NoteFormValues) => {
    createNoteMutation.mutate(
      { data },
      {
        onSuccess: (result) => {
          queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
          toast({ title: "Note created", description: "Your note has been saved." });
          setLocation(`/notes/${result.id}`);
        },
        onError: () => {
          toast({ variant: "destructive", title: "Failed to create note", description: "An error occurred while saving your note." });
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
            <h1 className="text-3xl font-bold tracking-tight">New Note</h1>
            <p className="text-muted-foreground">Upload a PDF or paste your study material.</p>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6 md:p-8 shadow-sm space-y-6">
          {/* Mode Toggle */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
            <button
              type="button"
              onClick={() => setInputMode("paste")}
              data-testid="tab-paste-text"
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                inputMode === "paste"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <FileText className="w-4 h-4" />
              Paste Text
            </button>
            <button
              type="button"
              onClick={() => setInputMode("pdf")}
              data-testid="tab-upload-pdf"
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                inputMode === "pdf"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Upload className="w-4 h-4" />
              Upload PDF
            </button>
          </div>

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

              {/* PDF Upload Zone */}
              {inputMode === "pdf" && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">PDF File</p>

                  {pdfState ? (
                    <div className="flex items-center gap-3 p-4 border rounded-lg bg-primary/5 border-primary/20">
                      <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{pdfState.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {pdfState.pageCount} page{pdfState.pageCount !== 1 ? "s" : ""} extracted — text is ready below
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground"
                        onClick={clearPdf}
                        data-testid="button-clear-pdf"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClick={() => fileInputRef.current?.click()}
                      data-testid="dropzone-pdf"
                      className={cn(
                        "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all select-none",
                        isDragging
                          ? "border-primary bg-primary/5 scale-[1.01]"
                          : "border-border hover:border-primary/50 hover:bg-muted/40"
                      )}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        className="hidden"
                        onChange={handleFileChange}
                        data-testid="input-pdf-file"
                      />
                      {isExtracting ? (
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-10 h-10 text-primary animate-spin" />
                          <p className="text-sm font-medium">Extracting text from PDF...</p>
                          <p className="text-xs text-muted-foreground">This only takes a moment</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                            <Upload className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Drop your PDF here, or click to browse</p>
                            <p className="text-xs text-muted-foreground mt-1">Supports text-based PDFs up to 20 MB</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Content field — always shown; label changes by mode */}
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {inputMode === "pdf" && pdfState ? "Extracted Content (editable)" : "Content"}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={
                          inputMode === "pdf"
                            ? "Extracted PDF text will appear here automatically..."
                            : "Paste your lecture notes here..."
                        }
                        className="min-h-[300px] resize-y font-mono text-sm"
                        readOnly={isExtracting}
                        {...field}
                        data-testid="input-note-content"
                      />
                    </FormControl>
                    <FormDescription>
                      {inputMode === "pdf" && pdfState
                        ? "You can review and edit the extracted text before saving."
                        : "The better and more detailed your notes, the better the AI generated materials will be."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  size="lg"
                  disabled={createNoteMutation.isPending || isExtracting}
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
