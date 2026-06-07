import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useGetNote, getGetNoteQueryKey, useGenerateQuiz, useSaveContent, getListSavedQueryKey } from "@workspace/api-client-react";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PenTool, Loader2, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type QuizQuestion = {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export default function NoteQuiz() {
  const params = useParams();
  const noteId = params.noteId ? parseInt(params.noteId) : 0;

  const { data: note, isLoading: noteLoading } = useGetNote(noteId, {
    query: { enabled: !!noteId, queryKey: getGetNoteQueryKey(noteId) },
  });

  const generateQuizMutation = useGenerateQuiz();
  const saveContentMutation = useSaveContent();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | undefined>(undefined);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const [isSaved, setIsSaved] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const hasTriggered = useRef(false);

  const runGenerate = () => {
    generateQuizMutation.mutate(
      { noteId },
      {
        onSuccess: (data) => setQuestions(data),
        onError: (err: unknown) => {
          const msg =
            (err as { data?: { error?: string } })?.data?.error ??
            "Failed to generate quiz. Please try again.";
          setErrorMsg(msg);
          toast({ variant: "destructive", title: "Generation failed", description: msg });
        },
      }
    );
  };

  useEffect(() => {
    if (!note || hasTriggered.current) return;
    hasTriggered.current = true;
    runGenerate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note]);

  const handleSave = () => {
    if (questions.length === 0 || !note) return;
    saveContentMutation.mutate(
      {
        data: {
          noteId,
          type: "quiz",
          title: `${note.title} - Quiz`,
          content: JSON.stringify(questions),
        },
      },
      {
        onSuccess: () => {
          setIsSaved(true);
          queryClient.invalidateQueries({ queryKey: getListSavedQueryKey() });
          toast({ title: "Saved successfully", description: "Quiz added to your saved content." });
        },
      }
    );
  };

  const handleOptionSelect = (value: string) => {
    if (isAnswered) return;
    setSelectedOption(value);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === undefined) return;
    setIsAnswered(true);
    const selectedIndex = parseInt(selectedOption);
    if (selectedIndex === questions[currentIndex].correctIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(undefined);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
    }
  };

  const isGenerating = noteLoading || generateQuizMutation.isPending;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href={`/notes/${noteId}`}>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Practice Quiz</h1>
              {note && <p className="text-muted-foreground text-sm">For: {note.title}</p>}
            </div>
          </div>
          {questions.length > 0 && isFinished && (
            <Button
              variant={isSaved ? "secondary" : "default"}
              onClick={handleSave}
              disabled={isSaved || saveContentMutation.isPending}
              data-testid="button-save-quiz"
            >
              {saveContentMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : isSaved ? (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isSaved ? "Saved" : "Save Quiz"}
            </Button>
          )}
        </div>

        {isGenerating ? (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col items-center justify-center py-24 text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                <PenTool className="w-12 h-12 text-primary animate-pulse relative z-10" />
              </div>
              <h3 className="text-xl font-bold mb-2">Generating questions...</h3>
              <p className="text-muted-foreground max-w-sm">
                Creating multiple choice questions to test your comprehension.
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
                  hasTriggered.current = true;
                  runGenerate();
                }}
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : questions.length > 0 ? (
          <div className="animate-in fade-in duration-500">
            {!isFinished ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span className="text-muted-foreground">Question {currentIndex + 1} of {questions.length}</span>
                  <span className="text-primary font-bold">Score: {score}</span>
                </div>

                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${(currentIndex / questions.length) * 100}%` }}
                  />
                </div>

                <Card>
                  <CardContent className="p-6 md:p-8">
                    <h3 className="text-xl md:text-2xl font-bold mb-8 leading-relaxed">
                      {questions[currentIndex].question}
                    </h3>

                    <RadioGroup
                      value={selectedOption}
                      onValueChange={handleOptionSelect}
                      className="space-y-4"
                      disabled={isAnswered}
                    >
                      {questions[currentIndex].options.map((option: string, idx: number) => {
                        const isSelected = selectedOption === idx.toString();
                        const isCorrect = isAnswered && idx === questions[currentIndex].correctIndex;
                        const isWrongSelection = isAnswered && isSelected && idx !== questions[currentIndex].correctIndex;

                        let optionClass = "border-2 rounded-xl p-4 flex items-start gap-3 cursor-pointer transition-all";
                        if (!isAnswered) {
                          optionClass += isSelected ? " border-primary bg-primary/5" : " border-border hover:border-primary/50";
                        } else {
                          if (isCorrect) optionClass += " border-green-500 bg-green-50 dark:bg-green-950/20";
                          else if (isWrongSelection) optionClass += " border-destructive bg-destructive/10";
                          else optionClass += " border-border/50 opacity-50";
                        }

                        return (
                          <Label key={idx} htmlFor={`option-${idx}`} className={optionClass}>
                            <RadioGroupItem value={idx.toString()} id={`option-${idx}`} className="mt-0.5" />
                            <span className="text-base font-medium leading-relaxed">{option}</span>
                          </Label>
                        );
                      })}
                    </RadioGroup>

                    {isAnswered && (
                      <div className="mt-8 p-4 rounded-lg bg-muted flex gap-3 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-sm mb-1">Explanation</p>
                          <p className="text-muted-foreground text-sm">{questions[currentIndex].explanation}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  {!isAnswered ? (
                    <Button
                      size="lg"
                      onClick={handleSubmitAnswer}
                      disabled={selectedOption === undefined}
                      data-testid="button-submit-answer"
                    >
                      Check Answer
                    </Button>
                  ) : (
                    <Button size="lg" onClick={handleNextQuestion} data-testid="button-next-question">
                      {currentIndex === questions.length - 1 ? "Finish Quiz" : "Next Question"}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <Card className="text-center py-16 px-6">
                <CardContent className="space-y-6 flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <span className="text-4xl font-bold text-primary">
                      {Math.round((score / questions.length) * 100)}%
                    </span>
                  </div>

                  <div>
                    <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
                    <p className="text-muted-foreground text-lg">
                      You scored {score} out of {questions.length} questions correctly.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCurrentIndex(0);
                        setScore(0);
                        setSelectedOption(undefined);
                        setIsAnswered(false);
                        setIsFinished(false);
                      }}
                    >
                      Retry Quiz
                    </Button>
                    <Link href={`/notes/${noteId}`}>
                      <Button>Back to Note</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
