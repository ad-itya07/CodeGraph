"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { apiClient } from "@/api/client";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError("");
    
    try {
      const validated = registerSchema.parse(formData);
      setIsLoading(true);
      
      // Call actual backend registration endpoint
      // Assuming endpoint is POST /auth/register
      await apiClient.post("/auth/register", {
        name: validated.name,
        email: validated.email,
        password: validated.password,
      });

      // Redirect to login upon successful registration
      router.push("/login?registered=true");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) newErrors[err.path[0].toString()] = err.message;
        });
        setErrors(newErrors);
      } else {
        setServerError(error.response?.data?.message || error.response?.data?.error || "Registration failed. Email might already be in use.");
        console.error(error);
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-8 pb-6 text-center border-b border-border/50">
          <Link href="/" className="inline-block mb-4">
            <div className="w-10 h-10 mx-auto rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="2" fill="var(--accent)" />
                <circle cx="2" cy="3" r="1.5" fill="var(--accent-light)" opacity="0.7" />
                <circle cx="14" cy="3" r="1.5" fill="var(--accent-light)" opacity="0.7" />
                <circle cx="2" cy="13" r="1.5" fill="var(--accent-light)" opacity="0.7" />
                <circle cx="14" cy="13" r="1.5" fill="var(--accent-light)" opacity="0.7" />
                <line x1="8" y1="8" x2="2" y2="3" stroke="var(--accent)" strokeWidth="0.8" opacity="0.5" />
                <line x1="8" y1="8" x2="14" y2="3" stroke="var(--accent)" strokeWidth="0.8" opacity="0.5" />
                <line x1="8" y1="8" x2="2" y2="13" stroke="var(--accent)" strokeWidth="0.8" opacity="0.5" />
                <line x1="8" y1="8" x2="14" y2="13" stroke="var(--accent)" strokeWidth="0.8" opacity="0.5" />
              </svg>
            </div>
          </Link>
          <h1 className="text-2xl font-bold font-heading text-foreground mb-1">Create an account</h1>
          <p className="text-sm text-muted">Join CodeGraph to start indexing repositories</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-5">
          {serverError && (
            <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm text-center">
              {serverError}
            </div>
          )}

          <Input
            label="Name"
            placeholder="John Doe"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            disabled={isLoading}
          />

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
            disabled={isLoading}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={errors.password}
            disabled={isLoading}
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            error={errors.confirmPassword}
            disabled={isLoading}
          />

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full h-11 bg-accent text-background font-semibold rounded-lg hover:bg-accent-light transition-colors shadow-lg shadow-accent/10 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
            ) : (
              "Sign Up"
            )}
          </button>
          
          <div className="text-center mt-2 text-sm text-muted">
            Already have an account?{" "}
            <Link href="/login" className="text-foreground hover:text-accent font-medium transition-colors">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
