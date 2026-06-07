import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";

import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Dashboard from "@/pages/dashboard";
import NotesList from "@/pages/notes/index";
import NewNote from "@/pages/notes/new";
import NoteDetail from "@/pages/notes/detail";
import NoteSummary from "@/pages/notes/summary";
import NoteFlashcards from "@/pages/notes/flashcards";
import NoteQuiz from "@/pages/notes/quiz";
import SavedContent from "@/pages/saved/index";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/notes" component={NotesList} />
      <Route path="/notes/new" component={NewNote} />
      <Route path="/notes/:noteId" component={NoteDetail} />
      <Route path="/notes/:noteId/summary" component={NoteSummary} />
      <Route path="/notes/:noteId/flashcards" component={NoteFlashcards} />
      <Route path="/notes/:noteId/quiz" component={NoteQuiz} />
      <Route path="/saved" component={SavedContent} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
