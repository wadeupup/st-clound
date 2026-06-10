"use client";

import { AlertCircle, CheckCircle } from "lucide-react";

import { useI18n } from "@/lib/i18n/context";
import {
  PASSWORD_REQUIREMENTS,
  passwordRequirementCheckers,
} from "@/types/authFormSchema";

interface PasswordRequirementsMessageProps {
  password: string;
  className?: string;
}

const REQUIREMENTS = [
  {
    key: "minLength",
    checker: passwordRequirementCheckers.minLength,
    labelKey: "minLength",
  },
  {
    key: "specialChars",
    checker: passwordRequirementCheckers.specialChars,
    labelKey: "specialChars",
  },
  {
    key: "uppercase",
    checker: passwordRequirementCheckers.uppercase,
    labelKey: "uppercase",
  },
  {
    key: "lowercase",
    checker: passwordRequirementCheckers.lowercase,
    labelKey: "lowercase",
  },
  {
    key: "numbers",
    checker: passwordRequirementCheckers.numbers,
    labelKey: "numbers",
  },
] as const;

export const PasswordRequirementsMessage = ({
  password,
  className = "",
}: PasswordRequirementsMessageProps) => {
  const { t } = useI18n();
  const hasPasswordInput = password.length > 0;
  if (!hasPasswordInput) {
    return null;
  }
  const results = REQUIREMENTS.map((req) => ({
    ...req,
    label:
      req.labelKey === "minLength"
        ? t.auth.passwordRequirements.minLength.replace(
            "{count}",
            PASSWORD_REQUIREMENTS.minLength.toString(),
          )
        : t.auth.passwordRequirements[req.labelKey],
    isMet: req.checker(password),
  }));
  const metCount = results.filter((r) => r.isMet).length;
  const allRequirementsMet = metCount === REQUIREMENTS.length;

  return (
    <div className={className}>
      <div
        className={`bg-bg-neutral-primary rounded-xl border p-3 ${allRequirementsMet ? "border-bg-pass" : "border-bg-fail"}`}
        role="region"
        aria-label={t.auth.passwordRequirements.statusLabel}
      >
        {allRequirementsMet ? (
          <div className="flex items-center gap-2">
            <CheckCircle
              className="text-text-success-primary h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <p className="text-text-neutral-primary text-xs leading-tight font-medium">
              {t.auth.passwordRequirements.allMet}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <AlertCircle
                className="text-text-error-primary h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              <p className="text-text-neutral-primary text-xs leading-tight font-medium">
                {t.auth.passwordRequirements.mustInclude}
              </p>
            </div>
            <ul
              className="ml-6 flex flex-col gap-0.5"
              aria-label={t.auth.passwordRequirements.requirementsLabel}
            >
              {results.map((req) => (
                <li
                  key={req.key}
                  className="flex items-center gap-2 text-xs leading-tight"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        req.isMet ? "bg-bg-pass" : "bg-bg-fail"
                      }`}
                      aria-hidden="true"
                    />
                    <span
                      className="text-text-neutral-secondary"
                      aria-label={`${req.label} ${req.isMet ? t.auth.passwordRequirements.satisfied : t.auth.passwordRequirements.required}`}
                    >
                      {req.label}
                    </span>
                  </div>
                  <span className="sr-only">
                    {req.isMet
                      ? t.auth.passwordRequirements.requirementMet
                      : t.auth.passwordRequirements.requirementNotMet}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
