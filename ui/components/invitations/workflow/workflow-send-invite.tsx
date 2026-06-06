"use client";

import { Progress } from "@heroui/progress";
import { Spacer } from "@heroui/spacer";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import React from "react";

import { useI18n } from "@/lib/i18n/context";
import { VerticalSteps } from "./vertical-steps";

export const WorkflowSendInvite = () => {
  const pathname = usePathname();
  const { t } = useI18n();

  const steps = useMemo(
    () => [
      {
        title: t.invitations.workflow.step1Title,
        description: t.invitations.workflow.step1Description,
        href: "/invitations/new",
      },
      {
        title: t.invitations.workflow.step2Title,
        description: t.invitations.workflow.step2Description,
        href: "/invitations/check-details",
      },
    ],
    [t],
  );

  // Calculate current step based on pathname
  const currentStepIndex = steps.findIndex((step) =>
    pathname.endsWith(step.href),
  );
  const currentStep = currentStepIndex === -1 ? 0 : currentStepIndex;

  return (
    <section className="w-full max-w-none p-3 sm:max-w-sm sm:p-0">
      <h1
        className="mb-2 text-lg font-medium sm:text-xl"
        id="getting-started"
        suppressHydrationWarning
      >
        {t.invitations.workflow.title}
      </h1>
      <p
        className="sm:text-small text-default-500 mb-3 text-xs sm:mb-5"
        suppressHydrationWarning
      >
        {t.invitations.workflow.description}
      </p>
      <Progress
        classNames={{
          base: "px-0.5 mb-3 sm:mb-5",
          label: "text-xs sm:text-small",
          value: "text-xs sm:text-small text-default-400",
          indicator: "bg-button-primary",
        }}
        label={t.invitations.workflow.steps}
        maxValue={steps.length}
        minValue={0}
        showValueLabel={true}
        size="sm"
        value={currentStep + 1}
        valueLabel={`${currentStep + 1} of ${steps.length}`}
      />

      {/* Desktop: Full vertical steps */}
      <div className="hidden sm:block">
        <VerticalSteps
          hideProgressBars
          currentStep={currentStep}
          stepClassName="border border-border-neutral-primary aria-[current]:border-button-primary aria-[current]:text-text-neutral-primary cursor-default"
          steps={steps}
        />
      </div>

      {/* Mobile: Compact current step indicator */}
      <div className="sm:hidden">
        <div className="text-text-neutral-secondary border-button-primary border-l-2 py-1 pl-3 text-xs">
          <div className="font-medium">
            {t.invitations.workflow.current}: {steps[currentStep]?.title}
          </div>
          <div className="text-default-300 mt-1 text-xs">
            {steps[currentStep]?.description}
          </div>
        </div>
      </div>

      <Spacer y={2} />
    </section>
  );
};
