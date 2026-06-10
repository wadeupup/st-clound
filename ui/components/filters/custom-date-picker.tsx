"use client";

import { Button, ButtonGroup } from "@heroui/button";
import { DatePicker } from "@heroui/date-picker";
import {
  getLocalTimeZone,
  parseDate,
  startOfMonth,
  startOfWeek,
  today,
} from "@internationalized/date";
import { useLocale } from "@react-aria/i18n";
import { useSearchParams } from "next/navigation";
import { ComponentProps, useEffect, useRef, useState } from "react";

import { useUrlFilters } from "@/hooks/use-url-filters";
import { useI18n } from "@/lib/i18n/context";

type DatePickerValue = NonNullable<ComponentProps<typeof DatePicker>["value"]>;

export const CustomDatePicker = () => {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const { updateFilter } = useUrlFilters();

  const [value, setValue] = useState<DatePickerValue | null>(() => {
    const dateParam = searchParams.get("filter[inserted_at]");
    if (!dateParam) return null;
    try {
      return parseDate(dateParam) as unknown as DatePickerValue;
    } catch {
      return null;
    }
  });

  const { locale } = useLocale();

  const now = today(getLocalTimeZone());
  const nextWeek = startOfWeek(now.add({ weeks: 1 }), locale);
  const nextMonth = startOfMonth(now.add({ months: 1 }));

  const applyDateFilter = (date: DatePickerValue | null) => {
    if (date) {
      updateFilter("inserted_at", date.toString());
    } else {
      updateFilter("inserted_at", null);
    }
  };

  const initialRender = useRef(true);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    if (params.size === 0) {
      setValue(null);
    }
  }, [searchParams]);

  const handleDateChange = (newValue: DatePickerValue | null) => {
    setValue(newValue);
    applyDateFilter(newValue);
  };

  return (
    <div className="flex w-full flex-col md:gap-2">
      <DatePicker
        style={{
          borderRadius: "0.5rem",
        }}
        aria-label={t.findings.datePicker.selectDate}
        classNames={{
          base: "w-full [&]:!rounded-lg [&>*]:!rounded-lg",
          selectorButton: "text-slate-600 dark:text-slate-400 shrink-0",
          input:
            "text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 text-sm",
          innerWrapper: "[&]:!rounded-lg",
          inputWrapper:
            "!border-slate-200 !bg-white/80 backdrop-blur-sm dark:!border-slate-800 dark:!bg-slate-900/80 dark:hover:!bg-slate-900/90 hover:!bg-slate-50/90 dark:hover:!bg-slate-800/90 !border [&]:!rounded-lg !shadow-sm !transition-[color,box-shadow] focus-within:!border-slate-300 dark:focus-within:!border-slate-700 focus-within:!ring-1 focus-within:!ring-slate-300 dark:focus-within:!ring-slate-700 focus-within:!ring-offset-1 !h-10 !px-4 !py-3 !outline-none",
          segment: "text-slate-900 dark:text-slate-100",
        }}
        popoverProps={{
          classNames: {
            content:
              "border-slate-200 bg-white/80 backdrop-blur-sm shadow-lg dark:border-slate-800 dark:bg-slate-900/80 border rounded-lg",
          },
        }}
        CalendarTopContent={
          <ButtonGroup
            fullWidth
            className="bg-slate-100 px-3 pt-3 pb-2 dark:bg-slate-800/50 [&>button]:border-slate-200 [&>button]:text-slate-900 dark:[&>button]:border-slate-700 dark:[&>button]:text-slate-100"
            radius="full"
            size="sm"
            variant="flat"
          >
            <Button
              onPress={() =>
                handleDateChange(now as unknown as DatePickerValue)
              }
            >
              {t.findings.datePicker.today}
            </Button>
            <Button
              onPress={() =>
                handleDateChange(nextWeek as unknown as DatePickerValue)
              }
            >
              {t.findings.datePicker.nextWeek}
            </Button>
            <Button
              onPress={() =>
                handleDateChange(nextMonth as unknown as DatePickerValue)
              }
            >
              {t.findings.datePicker.nextMonth}
            </Button>
          </ButtonGroup>
        }
        calendarProps={{
          nextButtonProps: {
            variant: "bordered",
          },
          prevButtonProps: {
            variant: "bordered",
          },
        }}
        value={value}
        onChange={handleDateChange}
      />
    </div>
  );
};
