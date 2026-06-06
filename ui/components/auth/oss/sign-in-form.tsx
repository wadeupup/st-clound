"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { authenticate } from "@/actions/auth";
import { AuthFooterLink } from "@/components/auth/oss/auth-footer-link";
import { AuthLayout } from "@/components/auth/oss/auth-layout";
import { Button } from "@/components/shadcn";
import { useToast } from "@/components/ui";
import { CustomInput } from "@/components/ui/custom";
import { Form } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n/context";
import { SignInFormData, signInSchema } from "@/types";

export const SignInForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const sessionError = searchParams.get("error");

    if (sessionError) {
      setTimeout(() => {
        const errorMessages: Record<
          string,
          { title: string; description: string }
        > = {
          RefreshAccessTokenError: {
            title: t.auth.sessionExpired,
            description: t.auth.sessionExpiredDesc,
          },
          MissingRefreshToken: {
            title: t.auth.sessionError,
            description: t.auth.sessionErrorDesc,
          },
        };

        const errorConfig = errorMessages[sessionError] || {
          title: t.auth.authError,
          description: t.auth.authErrorDesc,
        };

        toast({
          variant: "destructive",
          title: errorConfig.title,
          description: errorConfig.description,
        });
      }, 100);
    }
  }, [searchParams, toast]);

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (data: SignInFormData) => {
    const result = await authenticate(null, {
      email: data.email.toLowerCase(),
      password: data.password,
    });

    if (result?.message === "Success") {
      router.push("/");
    } else if (result?.errors && "credentials" in result.errors) {
      const message = result.errors.credentials ?? t.auth.invalidCredentials;

      form.setError("email", { type: "server", message });
      form.setError("password", { type: "server", message });
    } else if (result?.message === "User email is not verified") {
      router.push("/email-verification");
    } else {
      toast({
        variant: "destructive",
        title: t.auth.somethingWentWrong,
        description: t.auth.unexpectedError,
      });
    }
  };

  if (!mounted) {
    return (
      <AuthLayout title={t.auth.signIn}>
        <Form {...form}>
          <form
            noValidate
            method="post"
            className="flex flex-col gap-5"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <div className="space-y-1">
              <CustomInput
                control={form.control}
                name="email"
                type="email"
                label="Email"
                placeholder="Enter your email"
                variant="bordered"
                labelPlacement="outside"
                size="lg"
              />
            </div>
            <div className="space-y-1">
              <CustomInput
                control={form.control}
                name="password"
                password
                label="Password"
                placeholder="Enter your password"
                variant="bordered"
                labelPlacement="outside"
                size="lg"
              />
            </div>

            <Button
              type="submit"
              aria-label="Log in"
              aria-disabled={isLoading}
              className="mt-2 h-11 w-full text-base font-medium"
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Log in"}
            </Button>
          </form>
        </Form>

        <AuthFooterLink
          text="Need an account?"
          linkText="Sign up"
          href="/sign-up"
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={t.auth.signIn}>
      <Form {...form}>
        <form
          noValidate
          method="post"
          className="flex flex-col gap-5"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="space-y-1">
            <CustomInput
              control={form.control}
              name="email"
              type="email"
              label={t.auth.email}
              placeholder={t.auth.enterEmail}
              variant="bordered"
              labelPlacement="outside"
              size="lg"
            />
          </div>
          <div className="space-y-1">
            <CustomInput
              control={form.control}
              name="password"
              password
              label={t.auth.password}
              placeholder={t.auth.passwordPlaceholder}
              variant="bordered"
              labelPlacement="outside"
              size="lg"
            />
          </div>

          <Button
            type="submit"
            aria-label={t.auth.logIn}
            aria-disabled={isLoading}
            className="mt-2 h-11 w-full text-base font-medium"
            disabled={isLoading}
          >
            {isLoading ? t.auth.loading : t.auth.logIn}
          </Button>
        </form>
      </Form>

      <AuthFooterLink
        text={t.auth.needAccount}
        linkText={t.auth.signUp}
        href="/sign-up"
      />
    </AuthLayout>
  );
};
