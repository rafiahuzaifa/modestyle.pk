"use client";

import { useUser, SignedOut, RedirectToSignIn } from "@clerk/nextjs";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      {user && children}
    </>
  );
}
