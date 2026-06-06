"use client";

import { Progress } from "@heroui/progress";
import { Spacer } from "@heroui/spacer";
import { usePathname } from "next/navigation";
import React, { useMemo } from "react";

import { useI18n } from "@/lib/i18n/context";
import { VerticalSteps } from "./vertical-steps";

const getRouteConfig = (t: ReturnType<typeof useI18n>["t"]) => ({
  "/providers/connect-account": { stepIndex: 0 },
  "/providers/add-credentials": { stepIndex: 1 },
  "/providers/test-connection": { stepIndex: 2 },
  "/providers/update-credentials": {
    stepIndex: 1,
    stepOverride: {
      index: 2,
      title: t.providers.connectAccount.stepOverrideTitle,
      description: t.providers.connectAccount.stepOverrideDescription,
    },
  },
});

export const WorkflowAddProvider = () => {
  const { t } = useI18n();
  const pathname = usePathname();

  const steps = useMemo(
    () => [
      {
        title: t.providers.connectAccount.step1Title,
        description: t.providers.connectAccount.step1Description,
        href: "/providers/connect-account",
      },
      {
        title: t.providers.connectAccount.step2Title,
        description: t.providers.connectAccount.step2Description,
        href: "/providers/add-credentials",
      },
      {
        title: t.providers.connectAccount.step3Title,
        description: t.providers.connectAccount.step3Description,
        href: "/providers/test-connection",
      },
    ],
    [t],
  );

  const routeConfig = useMemo(() => getRouteConfig(t), [t]);
  const config = routeConfig[pathname] || { stepIndex: 0 };
  const currentStep = config.stepIndex;

  const updatedSteps = useMemo(() => {
    return steps.map((step, index) => {
      if (config.stepOverride && index === config.stepOverride.index) {
        return {
          ...step,
          title: config.stepOverride.title,
          description: config.stepOverride.description,
        };
      }
      return step;
    });
  }, [steps, config.stepOverride]);

  return (
    <section className="max-w-sm">
      <h1 className="mb-2 text-xl font-medium" id="getting-started">
        {t.providers.connectAccount.workflowTitle}
      </h1>
      <p className="text-small text-default-500 mb-5">
        {t.providers.connectAccount.workflowDescription}
      </p>
      <Progress
        classNames={{
          base: "px-0.5 mb-5",
          label: "text-small",
          value: "text-small text-button-primary",
          indicator: "bg-button-primary",
        }}
        label={t.providers.connectAccount.steps}
        maxValue={steps.length - 1}
        minValue={0}
        showValueLabel={true}
        size="md"
        value={currentStep}
        valueLabel={`${currentStep + 1} of ${steps.length}`}
      />
      <VerticalSteps
        hideProgressBars
        currentStep={currentStep}
        stepClassName="border border-border-neutral-primary aria-[current]:border-button-primary aria-[current]:text-text-neutral-primary cursor-default"
        steps={updatedSteps}
      />
      <Spacer y={4} />
    </section>
  );
};
