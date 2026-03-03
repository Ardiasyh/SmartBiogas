import LoginForm from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background">
      <div className="w-full max-w-4xl mx-auto">
        <h1 className="text-3xl font-semibold text-center mb-8">
          Login Smart Biogas
        </h1>

        <LoginForm className="w-full" />
      </div>
    </div>
  );
}
