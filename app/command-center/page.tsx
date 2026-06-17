import CommandCenter from "@/components/CommandCenter";
import {
  getAllAccounts,
  getAllVaultItems,
  VAULT_ITEM_TYPES,
  type VaultItemType,
} from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CommandCenterPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const [accounts, items] = await Promise.all([
    getAllAccounts(),
    getAllVaultItems(),
  ]);
  const initialValues = {
    type: getVaultItemType(getSingleParam(params.type)) || undefined,
    title: getSingleParam(params.title) || undefined,
    provider: getSingleParam(params.provider) || undefined,
    accountId: getSingleParam(params.accountId) || undefined,
    url: getSingleParam(params.url) || undefined,
    tags: getSingleParam(params.tags) || undefined,
    q: getSingleParam(params.q) || undefined,
  };

  return (
    <div className="flex flex-col gap-6 p-6 pl-16 md:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
          Command Center
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Your one place for subscriptions, documents, devices, key contacts,
          and emergency notes.
        </p>
      </div>
      <CommandCenter
        accounts={accounts}
        initialItems={items}
        initialValues={initialValues}
      />
    </div>
  );
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getVaultItemType(value: string | undefined): VaultItemType | "" {
  return VAULT_ITEM_TYPES.includes(value as VaultItemType)
    ? (value as VaultItemType)
    : "";
}
