"use client";

import { Select, SelectItem } from "@heroui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { SaveIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";

import { sendInvite } from "@/actions/invitations/invitation";
import { Button } from "@/components/shadcn";
import { useToast } from "@/components/ui";
import { CustomInput } from "@/components/ui/custom";
import { Form } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n/context";
import { ApiError } from "@/types";

export const SendInvitationForm = ({
  roles = [],
  defaultRole = "admin",
  isSelectorDisabled = false,
}: {
  roles: Array<{ id: string; name: string }>;
  defaultRole?: string;
  isSelectorDisabled: boolean;
}) => {
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useI18n();

  const sendInvitationFormSchema = z.object({
    email: z.email({ error: t.invitations.sendInvitation.validEmail }),
    roleId: z.string().min(1, t.invitations.sendInvitation.roleRequired),
  });

  type FormValues = z.infer<typeof sendInvitationFormSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(sendInvitationFormSchema),
    defaultValues: {
      email: "",
      roleId: isSelectorDisabled ? defaultRole : "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmitClient = async (values: FormValues) => {
    const formData = new FormData();
    formData.append("email", values.email);
    formData.append("role", values.roleId);

    try {
      const data = await sendInvite(formData);

      if (data?.errors && data.errors.length > 0) {
        data.errors.forEach((error: ApiError) => {
          const errorMessage = error.detail;
          const pointer = error.source?.pointer;
          switch (pointer) {
            case "/data/attributes/email":
              form.setError("email", {
                type: "server",
                message: errorMessage,
              });
              break;
            case "/data/relationships/roles":
              form.setError("roleId", {
                type: "server",
                message: errorMessage,
              });
              break;
            default:
              toast({
                variant: "destructive",
                title: t.invitations.sendInvitation.somethingWentWrong,
                description: errorMessage,
              });
          }
        });
      } else {
        const invitationId = data?.data?.id || "";
        router.push(`/invitations/check-details/?id=${invitationId}`);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: t.invitations.sendInvitation.error,
        description: t.invitations.sendInvitation.unexpectedError,
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmitClient)}
        className="flex flex-col gap-4"
      >
        {/* Email Field */}
        <CustomInput
          control={form.control}
          name="email"
          type="email"
          label={t.invitations.sendInvitation.email}
          labelPlacement="inside"
          placeholder={t.invitations.sendInvitation.enterEmail}
          variant="flat"
          isRequired
        />

        <Controller
          name="roleId"
          control={form.control}
          render={({ field }) => (
            <>
              <Select
                {...field}
                label={t.invitations.sendInvitation.role}
                placeholder={t.invitations.sendInvitation.selectRole}
                classNames={{
                  selectorIcon: "right-2",
                }}
                variant="flat"
                isDisabled={isSelectorDisabled}
                selectedKeys={[field.value]}
                onSelectionChange={(selected) =>
                  field.onChange(selected?.currentKey || "")
                }
              >
                {isSelectorDisabled ? (
                  <SelectItem key={defaultRole}>{defaultRole}</SelectItem>
                ) : (
                  roles.map((role) => (
                    <SelectItem key={role.id}>{role.name}</SelectItem>
                  ))
                )}
              </Select>
              {form.formState.errors.roleId && (
                <p className="text-text-error mt-2 text-sm">
                  {form.formState.errors.roleId.message}
                </p>
              )}
            </>
          )}
        />

        {/* Submit Button */}
        <div className="flex w-full justify-end sm:gap-6">
          <Button
            type="submit"
            className="w-1/2"
            variant="default"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>{t.invitations.sendInvitation.loading}</>
            ) : (
              <>
                <SaveIcon size={20} />
                <span>{t.invitations.sendInvitation.sendButton}</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};
