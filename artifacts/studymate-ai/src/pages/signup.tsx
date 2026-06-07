import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useSignup } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function Signup() {
  const signupMutation = useSignup();
  const { login } = useAuth();
  const { toast } = useToast();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: SignupFormValues) => {
    signupMutation.mutate(
      { data },
      {
        onSuccess: (result) => {
          login(result.user, result.token);
          toast({
            title: "Account created",
            description: "Welcome to StudyMate AI!",
          });
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Signup failed",
            description: error.error || "An error occurred during signup.",
          });
        },
      }
    );
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2 text-center md:text-left">
          <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
          <p className="text-muted-foreground">Start studying smarter today</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} data-testid="input-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" type="email" {...field} data-testid="input-email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input placeholder="••••••••" type="password" {...field} data-testid="input-password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full h-11" 
              disabled={signupMutation.isPending}
              data-testid="button-submit-signup"
            >
              {signupMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        </Form>

        <div className="text-center text-sm text-muted-foreground pt-4">
          Already have an account?{" "}
          <Link href="/login">
            <span className="text-primary font-medium hover:underline cursor-pointer" data-testid="link-goto-login">
              Sign in
            </span>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
