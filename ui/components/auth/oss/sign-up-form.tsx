"use client";

import { Checkbox } from "@heroui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { createNewUser } from "@/actions/auth";
import { AuthFooterLink } from "@/components/auth/oss/auth-footer-link";
import { AuthLayout } from "@/components/auth/oss/auth-layout";
import { PasswordRequirementsMessage } from "@/components/auth/oss/password-validator";
import { Button } from "@/components/shadcn";
import { useToast } from "@/components/ui";
import { CustomInput } from "@/components/ui/custom";
import { CustomLink } from "@/components/ui/custom/custom-link";
import {
  Form,
  FormControl,
  FormField,
  FormMessage,
} from "@/components/ui/form";
import { useI18n } from "@/lib/i18n/context";
import { ApiError, SignUpFormData, signUpSchema } from "@/types";

const AUTH_ERROR_PATHS = {
  NAME: "/data/attributes/name",
  EMAIL: "/data/attributes/email",
  PASSWORD: "/data/attributes/password",
  COMPANY_NAME: "/data/attributes/company_name",
  INVITATION_TOKEN: "/data",
} as const;

export const SignUpForm = ({
  invitationToken,
}: {
  invitationToken?: string | null;
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      email: "",
      password: "",
      isSamlMode: false,
      name: "",
      company: "",
      confirmPassword: "",
      ...(invitationToken && { invitationToken }),
    },
  });

  const passwordValue = useWatch({
    control: form.control,
    name: "password",
    defaultValue: "",
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (data: SignUpFormData) => {
    const newUser = await createNewUser(data);

    if (!newUser.errors) {
      toast({
        title: t.auth.success,
        description: t.auth.userRegistered,
      });
      form.reset();

      if (process.env.NEXT_PUBLIC_IS_CLOUD_ENV === "true") {
        router.push("/email-verification");
      } else {
        router.push("/sign-in");
      }
    } else {
      newUser.errors.forEach((error: ApiError) => {
        const errorMessage = error.detail;
        const pointer = error.source?.pointer;
        switch (pointer) {
          case AUTH_ERROR_PATHS.NAME:
            form.setError("name", { type: "server", message: errorMessage });
            break;
          case AUTH_ERROR_PATHS.EMAIL:
            form.setError("email", { type: "server", message: errorMessage });
            break;
          case AUTH_ERROR_PATHS.COMPANY_NAME:
            form.setError("company", {
              type: "server",
              message: errorMessage,
            });
            break;
          case AUTH_ERROR_PATHS.PASSWORD:
            form.setError("password", {
              type: "server",
              message: errorMessage,
            });
            break;
          case AUTH_ERROR_PATHS.INVITATION_TOKEN:
            form.setError("invitationToken", {
              type: "server",
              message: errorMessage,
            });
            break;
          default:
            toast({
              variant: "destructive",
              title: t.auth.somethingWentWrong,
              description: errorMessage,
            });
        }
      });
    }
  };

  if (!mounted) {
    return (
      <AuthLayout title="Sign up">
        <Form {...form}>
          <form
            noValidate
            method="post"
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <CustomInput
              control={form.control}
              name="name"
              type="text"
              label="Name"
              placeholder="Enter your name"
            />
            <CustomInput
              control={form.control}
              name="company"
              type="text"
              label="Company Name"
              placeholder="Enter your company name"
              isRequired={false}
            />
            <CustomInput
              control={form.control}
              name="email"
              type="email"
              label="Email"
              placeholder="Enter your email"
            />
            <CustomInput
              control={form.control}
              name="password"
              password
              label="Password"
              placeholder="Enter your password"
            />
            <PasswordRequirementsMessage password={passwordValue || ""} />
            <CustomInput
              control={form.control}
              name="confirmPassword"
              confirmPassword
              label="Confirm Password"
              placeholder="Confirm your password"
            />
            {invitationToken && (
              <CustomInput
                control={form.control}
                name="invitationToken"
                type="text"
                label="Invitation Token"
                placeholder={invitationToken}
                defaultValue={invitationToken}
                isRequired={false}
                isDisabled={invitationToken !== null && true}
              />
            )}

            {process.env.NEXT_PUBLIC_IS_CLOUD_ENV === "true" && (
              <FormField
                control={form.control}
                name="termsAndConditions"
                render={({ field }) => (
                  <>
                    <FormControl>
                      <Checkbox
                        isRequired
                        className="py-4"
                        size="sm"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        color="default"
                      >
                        I agree to the&nbsp;
                        <CustomLink
                          href="https://prowler.com/terms-of-service/"
                          size="sm"
                        >
                          Terms of Service
                        </CustomLink>
                        &nbsp;of ST Cloud
                      </Checkbox>
                    </FormControl>
                    <FormMessage className="text-text-error" />
                  </>
                )}
              />
            )}

            <Button
              type="submit"
              aria-label="Sign up"
              aria-disabled={isLoading}
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Sign up"}
            </Button>
          </form>
        </Form>

        <AuthFooterLink
          text="Already have an account?"
          linkText="Log in"
          href="/sign-in"
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={t.auth.signUp}>
      <Form {...form}>
        <form
          noValidate
          method="post"
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <CustomInput
            control={form.control}
            name="name"
            type="text"
            label={t.auth.name}
            placeholder={t.auth.enterName}
          />
          <CustomInput
            control={form.control}
            name="company"
            type="text"
            label={t.auth.companyName}
            placeholder={t.auth.enterCompanyName}
            isRequired={false}
          />
          <CustomInput
            control={form.control}
            name="email"
            type="email"
            label={t.auth.email}
            placeholder={t.auth.enterEmail}
          />
          <CustomInput
            control={form.control}
            name="password"
            password
            label={t.auth.password}
            placeholder={t.auth.passwordPlaceholder}
          />
          <PasswordRequirementsMessage password={passwordValue || ""} />
          <CustomInput
            control={form.control}
            name="confirmPassword"
            confirmPassword
            label={t.auth.confirmPassword}
            placeholder={t.auth.confirmPasswordPlaceholder}
          />
          {invitationToken && (
            <CustomInput
              control={form.control}
              name="invitationToken"
              type="text"
              label={t.auth.invitationToken}
              placeholder={invitationToken}
              defaultValue={invitationToken}
              isRequired={false}
              isDisabled={invitationToken !== null && true}
            />
          )}

          {process.env.NEXT_PUBLIC_IS_CLOUD_ENV === "true" && (
            <FormField
              control={form.control}
              name="termsAndConditions"
              render={({ field }) => (
                <>
                  <FormControl>
                    <Checkbox
                      isRequired
                      className="py-4"
                      size="sm"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      color="default"
                    >
                      {t.auth.termsAgreement}&nbsp;
                      <CustomLink
                        href="https://prowler.com/terms-of-service/"
                        size="sm"
                      >
                        {t.auth.termsOfService}
                      </CustomLink>
                      &nbsp;{t.auth.termsOfServiceOf}
                    </Checkbox>
                  </FormControl>
                  <FormMessage className="text-text-error" />
                </>
              )}
            />
          )}

          <Button
            type="submit"
            aria-label={t.auth.signUp}
            aria-disabled={isLoading}
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? t.auth.loading : t.auth.signUp}
          </Button>
        </form>
      </Form>

      <AuthFooterLink
        text={t.auth.alreadyHaveAccount}
        linkText={t.auth.logIn}
        href="/sign-in"
      />
    </AuthLayout>
  );
};
