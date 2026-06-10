"use client";
import { Divider } from "@heroui/divider";
import { zodResolver } from "@hookform/resolvers/zod";
import { SaveIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";

import { createProviderGroup } from "@/actions/manage-groups";
import { Button } from "@/components/shadcn";
import { useToast } from "@/components/ui";
import { CustomDropdownSelection, CustomInput } from "@/components/ui/custom";
import { Form } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n/context";
import { ApiError } from "@/types";

export const AddGroupForm = ({
  roles = [],
  providers = [],
}: {
  roles: Array<{ id: string; name: string }>;
  providers: Array<{ id: string; name: string }>;
}) => {
  const { toast } = useToast();
  const { t } = useI18n();

  const addGroupSchema = z.object({
    name: z
      .string()
      .min(1, t.providers.providerGroups.forms.providerGroupNameRequired),
    providers: z.array(z.string()).optional(),
    roles: z.array(z.string()).optional(),
  });

  type FormValues = z.infer<typeof addGroupSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(addGroupSchema),
    defaultValues: {
      name: "",
      providers: [],
      roles: [],
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmitClient = async (values: FormValues) => {
    try {
      const formData = new FormData();
      formData.append("name", values.name);

      if (values.providers?.length) {
        const providersData = values.providers.map((id) => ({
          id,
          type: "providers",
        }));
        formData.append("providers", JSON.stringify(providersData));
      }

      if (values.roles?.length) {
        const rolesData = values.roles.map((id) => ({
          id,
          type: "roles",
        }));
        formData.append("roles", JSON.stringify(rolesData));
      }

      const data = await createProviderGroup(formData);

      if (data?.errors && data.errors.length > 0) {
        data.errors.forEach((error: ApiError) => {
          const errorMessage = error.detail;
          const pointer = error.source?.pointer;
          switch (pointer) {
            case "/data/attributes/name":
              form.setError("name", {
                type: "server",
                message: errorMessage,
              });
              break;
            case "/data/relationships/roles":
              form.setError("roles", {
                type: "server",
                message: errorMessage,
              });
              break;
            default:
              toast({
                variant: "destructive",
                title: t.providers.providerGroups.forms.somethingWentWrong,
                description: errorMessage,
              });
          }
        });
      } else {
        form.reset();
        toast({
          title: t.providers.providerGroups.forms.success,
          description:
            t.providers.providerGroups.forms.groupCreatedSuccessfully,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: t.providers.providerGroups.forms.error,
        description: t.providers.providerGroups.forms.unexpectedError,
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmitClient)}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-2">
          <CustomInput
            control={form.control}
            name="name"
            type="text"
            label={t.providers.providerGroups.forms.providerGroupName}
            labelPlacement="inside"
            placeholder={
              t.providers.providerGroups.forms.enterProviderGroupName
            }
            variant="flat"
            isRequired
          />
        </div>

        {/*Select Providers */}
        <Controller
          name="providers"
          control={form.control}
          render={({ field }) => (
            <CustomDropdownSelection
              label={t.providers.providerGroups.forms.selectProviders}
              name="providers"
              values={providers}
              selectedKeys={field.value || []}
              onChange={(name, selectedValues) =>
                field.onChange(selectedValues)
              }
            />
          )}
        />
        {form.formState.errors.providers && (
          <p className="mt-2 text-sm text-red-600">
            {form.formState.errors.providers.message}
          </p>
        )}
        <Divider orientation="horizontal" className="mb-2" />

        <p className="text-small text-default-500">
          {t.providers.providerGroups.forms.rolesOptionalDescription}
        </p>
        {/* Select Roles */}
        <Controller
          name="roles"
          control={form.control}
          render={({ field }) => (
            <CustomDropdownSelection
              label={t.providers.providerGroups.forms.selectRoles}
              name="roles"
              values={roles}
              selectedKeys={field.value || []}
              onChange={(name, selectedValues) =>
                field.onChange(selectedValues)
              }
            />
          )}
        />
        {form.formState.errors.roles && (
          <p className="mt-2 text-sm text-red-600">
            {form.formState.errors.roles.message}
          </p>
        )}

        {/* Submit Button */}
        <div className="flex w-full justify-end sm:gap-6">
          <Button type="submit" className="w-1/2" disabled={isLoading}>
            {!isLoading && <SaveIcon size={24} />}
            {isLoading
              ? t.providers.providerGroups.forms.loading
              : t.providers.providerGroups.forms.createGroup}
          </Button>
        </div>
      </form>
    </Form>
  );
};
