import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useGetDashboardStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Bookmark, Zap, Brain, PenTool, LayoutDashboard, PlusCircle, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Overview of your study materials and progress.</p>
          </div>
          <Link href="/notes/new">
            <Button data-testid="button-create-note-dash">
              <PlusCircle className="w-4 h-4 mr-2" />
              New Note
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-1/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" data-testid="stat-total-notes">{stats.totalNotes}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">Saved Items</CardTitle>
                  <Bookmark className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" data-testid="stat-total-saved">{stats.totalSaved}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">Flashcards</CardTitle>
                  <Brain className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" data-testid="stat-flashcards">{stats.flashcardsGenerated}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">Quizzes Taken</CardTitle>
                  <PenTool className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" data-testid="stat-quizzes">{stats.quizzesGenerated}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold tracking-tight">Recent Notes</h2>
                  <Link href="/notes">
                    <span className="text-sm text-primary font-medium flex items-center hover:underline cursor-pointer" data-testid="link-view-all-notes">
                      View all <ArrowRight className="w-4 h-4 ml-1" />
                    </span>
                  </Link>
                </div>
                
                {stats.recentNotes && stats.recentNotes.length > 0 ? (
                  <div className="grid gap-4">
                    {stats.recentNotes.map((note) => (
                      <Link href={`/notes/${note.id}`} key={note.id}>
                        <Card className="hover:border-primary/50 transition-colors cursor-pointer group" data-testid={`card-recent-note-${note.id}`}>
                          <CardContent className="p-5 flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">{note.title}</h3>
                                {note.subject && (
                                  <span className="px-2 py-0.5 rounded text-xs bg-muted font-medium text-muted-foreground">
                                    {note.subject}
                                  </span>
                                )}
                              </div>
                              <p className="text-muted-foreground text-sm line-clamp-1">
                                {new Date(note.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Card className="bg-muted/50 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                      <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-medium mb-1">No notes yet</h3>
                      <p className="text-muted-foreground mb-4">Create your first note to get started.</p>
                      <Link href="/notes/new">
                        <Button variant="outline">Create Note</Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              <div className="space-y-4">
                <h2 className="text-xl font-bold tracking-tight">Quick Actions</h2>
                <div className="grid gap-3">
                  <Link href="/notes/new">
                    <Card className="hover:bg-accent/50 hover:border-primary/30 transition-colors cursor-pointer">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          <PlusCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-medium">Upload Notes</div>
                          <div className="text-xs text-muted-foreground">Add new material</div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                  <Link href="/saved">
                    <Card className="hover:bg-accent/50 hover:border-primary/30 transition-colors cursor-pointer">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          <Bookmark className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-medium">Review Saved</div>
                          <div className="text-xs text-muted-foreground">Study your flashcards</div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}

function ChevronRight({ className }: { className?: string }) {
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
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
