import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { BookOpen, Brain, Sparkles, Target, Zap, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

export default function Landing() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) return null;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary/20">
      <header className="container mx-auto px-4 h-20 flex items-center justify-between border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shadow-sm">S</div>
          <span className="font-bold text-xl tracking-tight">StudyMate AI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" data-testid="link-login">Sign in</Button>
          </Link>
          <Link href="/signup">
            <Button data-testid="link-signup">Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-24 md:py-32 lg:py-40 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-20 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-indigo-500/30 blur-3xl rounded-full" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-sm mb-8 border border-primary/20">
              <Sparkles className="w-4 h-4" />
              <span>Smarter studying is here</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-8">
              Your brilliant study partner, <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600">available 24/7.</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              Transform your notes into concise summaries, smart flashcards, and practice quizzes instantly. Focus on understanding, let AI handle the heavy lifting.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="h-14 px-8 text-lg rounded-xl" data-testid="button-hero-cta">
                  Start studying for free
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-muted/30 border-y border-border/40">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold mb-4">Everything you need to master your subjects</h2>
              <p className="text-muted-foreground text-lg">Upload your notes once, generate endless study materials.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  icon: Zap,
                  title: "Smart Summaries",
                  description: "Distill long lectures into actionable key points and concise summaries instantly."
                },
                {
                  icon: BookOpen,
                  title: "Auto Flashcards",
                  description: "Generate comprehensive flashcard decks from your notes for spaced repetition."
                },
                {
                  icon: Target,
                  title: "Practice Quizzes",
                  description: "Test your knowledge with AI-generated multiple choice questions tailored to your material."
                }
              ].map((feature, i) => (
                <div key={i} className="bg-card border border-border p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="container mx-auto px-4 py-8 border-t border-border/40 text-center text-muted-foreground text-sm flex flex-col md:flex-row justify-between items-center">
        <div>© {new Date().getFullYear()} StudyMate AI. All rights reserved.</div>
        <div className="flex items-center gap-2 mt-4 md:mt-0 font-medium">
          <div className="w-5 h-5 rounded bg-primary text-primary-foreground flex items-center justify-center text-xs">S</div>
          StudyMate AI
        </div>
      </footer>
    </div>
  );
}
