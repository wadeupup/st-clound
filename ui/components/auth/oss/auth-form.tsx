"use client";

import { SignInForm } from "@/components/auth/oss/sign-in-form";
import { SignUpForm } from "@/components/auth/oss/sign-up-form";

export const AuthForm = ({
  type,
  invitationToken,
}: {
  type: string;
  invitationToken?: string | null;
  googleAuthUrl?: string;
  githubAuthUrl?: string;
  isGoogleOAuthEnabled?: boolean;
  isGithubOAuthEnabled?: boolean;
}) => {
  if (type === "sign-in") {
    return <SignInForm />;
  }

  return <SignUpForm invitationToken={invitationToken} />;
};
