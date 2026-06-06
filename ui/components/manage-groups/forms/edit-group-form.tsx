"use client";

import { Divider } from "@heroui/divider";
import { zodResolver } from "@hookform/resolvers/zod";
import { SaveIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";

import { updateProviderGroup } from "@/actions/manage-groups/manage-groups";
import { Button } from "@/components/shadcn";
import { useToast } from "@/components/ui";
import { CustomDropdownSelection, CustomInput } from "@/components/ui/custom";
import { Form } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n/context";
import { ApiError } from "@/types";

export const EditGroupForm = ({
  providerGroupId,
  providerGroupData,
  allProviders,
  allRoles,
}: {
  providerGroupId: string;
  providerGroupData: {
    name: string;
    providers?: Array<{ id: string; name: string }>;
    roles?: Array<{ id: string; name: string }>;
  };
  allProviders: { id: string; name: string }[];
  allRoles: { id: string; name: string }[];
}) => {
  const { toast } = useToast();
  const { t } = useI18n();
  const router = useRouter();

  const editGroupSchema = z.object({
    name: z.string().min(1, t.providers.providerGroups.forms.providerGroupNameRequired),
    providers: z.array(z.object({ id: z.string(), name: z.string() })).optional(),
    roles: z.array(z.object({ id: z.string(), name: z.string() })).optional(),
  });

  type FormValues = z.infer<typeof editGroupSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(editGroupSchema),
    defaultValues: providerGroupData,
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmitClient = async (values: FormValues) => {
    try {
      const updatedFields: Partial<FormValues> = {};

      // Detect changes in the name
      if (values.name !== providerGroupData.name) {
        updatedFields.name = values.name;
      }

      // Detect changes in providers
      if (
        JSON.stringify(values.providers) !==
        JSON.stringify(providerGroupData.providers)
      ) {
        updatedFields.providers = values.providers;
      }

      // Detect changes in roles
      if (
        JSON.stringify(values.roles) !== JSON.stringify(providerGroupData.roles)
      ) {
        updatedFields.roles = values.roles;
      }

      // If no changes, notify the user and exit
      if (Object.keys(updatedFields).length === 0) {
        toast({
          title: t.providers.providerGroups.forms.noChangesDetected,
          description: t.providers.providerGroups.forms.noUpdatesMade,
        });
        return;
      }

      // Create FormData dynamically
      const formData = new FormData();
      if (updatedFields.name) {
        formData.append("name", updatedFields.name);
      }
      if (updatedFields.providers) {
        const providersData = updatedFields.providers.map((provider) => ({
          id: provider.id,
          type: "providers",
        }));
        formData.append("providers", JSON.stringify(providersData));
      }
      if (updatedFields.roles) {
        const rolesData = updatedFields.roles.map((role) => ({
          id: role.id,
          type: "roles",
        }));
        formData.append("roles", JSON.stringify(rolesData));
      }

      // Call the update action
      const data = await updateProviderGroup(providerGroupId, formData);

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
        toast({
          title: t.providers.providerGroups.forms.success,
          description: t.providers.providerGroups.forms.groupUpdatedSuccessfully,
        });
        router.push("/manage-groups");
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
        {/* Field for the name */}
        <div className="flex flex-col gap-2">
          <CustomInput
            control={form.control}
            name="name"
            type="text"
            label={t.providers.providerGroups.forms.providerGroupName}
            labelPlacement="inside"
            placeholder={t.providers.providerGroups.forms.enterProviderGroupName}
            variant="flat"
            isRequired
          />
        </div>

        {/* Providers selection */}
        <Controller
          name="providers"
          control={form.control}
          render={({ field }) => {
            const combinedProviders = [
              ...(providerGroupData.providers || []).map((p) => ({
                ...p,
                name: p.name || t.providers.providerGroups.unavailableForRole,
              })),
              ...allProviders.filter(
                (p) =>
                  !(providerGroupData.providers || []).some(
                    (sp) => sp.id === p.id,
                  ),
              ),
            ];

            return (
              <CustomDropdownSelection
                label={t.providers.providerGroups.forms.selectProviders}
                name="providers"
                values={combinedProviders}
                selectedKeys={field.value?.map((p) => p.id) || []}
                onChange={(name, selectedValues) => {
                  const selectedProviders = combinedProviders.filter(
                    (provider) => selectedValues.includes(provider.id),
                  );
                  field.onChange(selectedProviders);
                }}
              />
            );
          }}
        />
        {form.formState.errors.providers && (
          <p className="mt-2 text-sm text-red-600">
            {form.formState.errors.providers.message}
          </p>
        )}

        <Divider orientation="horizontal" className="mb-2" />
        <p className="text-small text-default-500">
          {t.providers.providerGroups.forms.rolesEditDescription}
        </p>
        {/* Roles selection */}
        <Controller
          name="roles"
          control={form.control}
          render={({ field }) => {
            const combinedRoles = [
              ...(providerGroupData.roles || []).map((r) => ({
                ...r,
                name: r.name || t.providers.providerGroups.unavailableForRole,
              })),
              ...allRoles.filter(
                (r) =>
                  !(providerGroupData.roles || []).some((sr) => sr.id === r.id),
              ),
            ];

            return (
              <CustomDropdownSelection
                label={t.providers.providerGroups.forms.selectRoles}
                name="roles"
                values={combinedRoles}
                selectedKeys={field.value?.map((r) => r.id) || []}
                onChange={(name, selectedValues) => {
                  const selectedRoles = combinedRoles.filter((role) =>
                    selectedValues.includes(role.id),
                  );
                  field.onChange(selectedRoles);
                }}
              />
            );
          }}
        />
        {form.formState.errors.roles && (
          <p className="mt-2 text-sm text-red-600">
            {form.formState.errors.roles.message}
          </p>
        )}

        <div className="flex w-full justify-end gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              router.push("/manage-groups");
            }}
            disabled={isLoading}
          >
            {t.providers.providerGroups.forms.cancel}
          </Button>
          <Button type="submit" className="w-1/2" disabled={isLoading}>
            {!isLoading && <SaveIcon size={24} />}
            {isLoading ? t.providers.providerGroups.forms.loading : t.providers.providerGroups.forms.updateGroup}
          </Button>
        </div>
      </form>
    </Form>
  );
};
