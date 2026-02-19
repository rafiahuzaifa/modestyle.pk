import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gold-50 to-white py-12">
      <div className="text-center">
        <h1 className="font-display text-3xl mb-2">Welcome Back</h1>
        <p className="text-sm text-gray-500 mb-8">
          Sign in to your ModestStyle.pk account
        </p>
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg border border-gold-100",
              headerTitle: "font-display",
              formButtonPrimary:
                "bg-secondary hover:bg-secondary/90 text-sm normal-case",
            },
          }}
        />
      </div>
    </div>
  );
}
