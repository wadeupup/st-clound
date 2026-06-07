"use client";

import { Progress } from "@heroui/progress";
import { Spacer } from "@heroui/spacer";
import { usePathname } from "next/navigation";
import React from "react";

import { useI18n } from "@/lib/i18n/context";

import { VerticalSteps } from "./vertical-steps";

export const WorkflowAddEditRole = () => {
  const pathname = usePathname();
  const { t } = useI18n();

  const steps = [
    {
      title: t.roles.workflow.createTitle,
      description: t.roles.workflow.createDescription,
      href: "/roles/new",
    },
    {
      title: t.roles.workflow.editTitle,
      description: t.roles.workflow.editDescription,
      href: "/roles/edit",
    },
  ];

  // Calculate current step based on pathname
  const currentStepIndex = steps.findIndex((step) =>
    pathname.endsWith(step.href),
  );
  const currentStep = currentStepIndex === -1 ? 0 : currentStepIndex;

  return (
    <section className="max-w-sm">
      <h1 className="mb-2 text-xl font-medium" id="getting-started">
        {t.roles.workflow.manageRolePermissions}
      </h1>
      <p className="text-small text-default-500 mb-5">
        {t.roles.workflow.description}
      </p>
      <Progress
        classNames={{
          base: "px-0.5 mb-5",
          label: "text-small",
          value: "text-small text-default-400",
        }}
        label={t.roles.workflow.steps}
        maxValue={steps.length - 1}
        minValue={0}
        showValueLabel={true}
        size="md"
        value={currentStep}
        valueLabel={t.roles.workflow.stepOf
          .replace("{current}", (currentStep + 1).toString())
          .replace("{total}", steps.length.toString())}
      />
      <VerticalSteps
        hideProgressBars
        currentStep={currentStep}
        stepClassName="border border-border-neutral-primary aria-[current]:border-button-primary aria-[current]:text-text-neutral-primary cursor-default"
        steps={steps}
      />
      <Spacer y={4} />
    </section>
  );
};
