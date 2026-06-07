import { ReactNode, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export function AuthLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 order-2 md:order-1">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
      <div className="flex-1 bg-primary text-primary-foreground p-12 hidden md:flex flex-col justify-between order-1 md:order-2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-indigo-700 opacity-90" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-16">
            <div className="w-8 h-8 rounded bg-white text-primary flex items-center justify-center font-bold text-xl">S</div>
            <span className="font-bold text-2xl tracking-tight">StudyMate AI</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
            Your brilliant study partner, available 24/7.
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-md">
            Transform notes into insights, flashcards, and quizzes instantly. Focus on understanding, let AI handle the formatting.
          </p>
        </div>
        <div className="relative z-10 text-primary-foreground/60 text-sm">
          Built for students who take their studies seriously.
        </div>
      </div>
    </div>
  );
}
