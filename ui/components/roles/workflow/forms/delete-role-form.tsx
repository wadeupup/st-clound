"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { deleteRole } from "@/actions/roles";
import { DeleteIcon } from "@/components/icons";
import { Button } from "@/components/shadcn";
import { useToast } from "@/components/ui";
import { Form } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n/context";

const formSchema = z.object({
  roleId: z.string(),
});

export const DeleteRoleForm = ({
  roleId,
  setIsOpen,
}: {
  roleId: string;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const { t } = useI18n();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });
  const { toast } = useToast();
  const isLoading = form.formState.isSubmitting;

  async function onSubmitClient(formData: FormData) {
    const roleId = formData.get("id") as string;
    const data = await deleteRole(roleId);

    if (data?.errors && data.errors.length > 0) {
      const error = data.errors[0];
      const errorMessage = `${error.detail}`;
      // show error
      toast({
        variant: "destructive",
        title: t.roles.deleteModal.somethingWentWrong,
        description: errorMessage,
      });
    } else {
      toast({
        title: t.roles.deleteModal.success,
        description: t.roles.deleteModal.roleRemoved,
      });
    }
    setIsOpen(false); // Close the modal on success
  }

  return (
    <Form {...form}>
      <form action={onSubmitClient}>
        <input type="hidden" name="id" value={roleId} />
        <div className="flex w-full justify-end gap-4">
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            {t.roles.deleteModal.cancel}
          </Button>

          <Button
            type="submit"
            variant="destructive"
            size="lg"
            disabled={isLoading}
          >
            {!isLoading && <DeleteIcon size={24} />}
            {isLoading ? t.roles.deleteModal.loading : t.roles.deleteModal.delete}
          </Button>
        </div>
      </form>
    </Form>
  );
};
