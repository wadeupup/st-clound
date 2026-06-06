import { Select, SelectItem } from "@heroui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailIcon, ShieldIcon } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";

import { updateInvite } from "@/actions/invitations/invitation";
import { useToast } from "@/components/ui";
import { CustomInput } from "@/components/ui/custom";
import { Form, FormButtons } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n/context";
import { editInviteFormSchema } from "@/types";

import { Card, CardContent } from "../../shadcn";

export const EditForm = ({
  invitationId,
  invitationEmail,
  roles = [],
  currentRole = "",
  setIsOpen,
}: {
  invitationId: string;
  invitationEmail?: string;
  roles: Array<{ id: string; name: string }>;
  currentRole?: string;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const { t } = useI18n();
  const formSchema = editInviteFormSchema;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invitationId,
      invitationEmail: invitationEmail || "",
      role: roles.find((role) => role.name === currentRole)?.id || "",
    },
  });

  const { toast } = useToast();

  const isLoading = form.formState.isSubmitting;

  const onSubmitClient = async (values: z.infer<typeof formSchema>) => {
    const changedFields: { [key: string]: any } = {};

    // Check if the email changed
    if (values.invitationEmail && values.invitationEmail !== invitationEmail) {
      changedFields.invitationEmail = values.invitationEmail;
    }

    // Check if the role changed
    const currentRoleId =
      roles.find((role) => role.name === currentRole)?.id || "";
    if (values.role && values.role !== currentRoleId) {
      changedFields.role = values.role;
    }

    // If there are no changes, avoid the request
    if (Object.keys(changedFields).length === 0) {
      toast({
        title: t.invitations.editModal.noChangesDetected,
        description: t.invitations.editModal.noChangesDescription,
      });
      return;
    }

    changedFields.invitationId = invitationId; // Always include the ID

    const formData = new FormData();
    Object.entries(changedFields).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const data = await updateInvite(formData);

    if (data?.error) {
      toast({
        variant: "destructive",
        title: t.invitations.editModal.somethingWentWrong,
        description: `${data.error}`,
      });
    } else {
      toast({
        title: t.invitations.editModal.success,
        description: t.invitations.editModal.invitationUpdated,
      });
      setIsOpen(false); // Close the modal on success
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmitClient)}
        className="flex flex-col gap-4"
      >
        <Card variant="inner">
          <CardContent className="flex flex-row justify-center gap-4">
            <div className="text-small text-text-neutral-secondary flex items-center">
              <MailIcon className="text-text-neutral-secondary mr-2 h-4 w-4" />
              <span className="text-text-neutral-secondary">{t.invitations.editModal.email}:</span>
              <span className="text-text-neutral-secondary ml-2 font-semibold">
                {invitationEmail}
              </span>
            </div>
            <div className="text-small flex items-center text-gray-600">
              <ShieldIcon className="text-text-neutral-secondary mr-2 h-4 w-4" />
              <span className="text-text-neutral-secondary">{t.invitations.editModal.role}:</span>
              <span className="text-text-neutral-secondary ml-2 font-semibold">
                {currentRole || t.invitations.editModal.noRole}
              </span>
            </div>
          </CardContent>
        </Card>

        <div>
          <CustomInput
            control={form.control}
            name="invitationEmail"
            type="email"
            label={t.invitations.editModal.email}
            labelPlacement="outside"
            placeholder={invitationEmail}
            variant="flat"
            isRequired={false}
          />
        </div>
        <div>
          <Controller
            name="role"
            control={form.control}
            render={({ field }) => (
              <Select
                {...field}
                label={t.invitations.editModal.role}
                placeholder={t.invitations.editModal.selectRole}
                classNames={{
                  selectorIcon: "right-2",
                }}
                variant="flat"
                selectedKeys={[field.value || ""]}
                onSelectionChange={(selected) =>
                  field.onChange(selected?.currentKey || "")
                }
              >
                {roles.map((role) => (
                  <SelectItem key={role.id}>{role.name}</SelectItem>
                ))}
              </Select>
            )}
          />

          {form.formState.errors.role && (
            <p className="mt-2 text-sm text-red-600">
              {form.formState.errors.role.message}
            </p>
          )}
        </div>
        <input type="hidden" name="invitationId" value={invitationId} />

        <FormButtons setIsOpen={setIsOpen} isDisabled={isLoading} />
      </form>
    </Form>
  );
};
