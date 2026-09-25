import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Star } from "lucide-react";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { useAppDispatch, useAppSelector } from "../../app/store/hooks";
import {
  addAddress,
  removeAddress,
  selectAddresses,
  setDefaultAddress,
  updateAddress,
} from "../../features/account/addressesSlice";
import { AddressForm } from "../../components/checkout/AddressForm";
import { TextField } from "../../components/ui/TextField";
import { EmptyState } from "../../components/common/EmptyState";
import type { SavedAddress } from "../../types/address";
import type { ShippingAddress } from "../../types/order";

export function AddressesPage() {
  const isAuthenticated = useAuthGuard();
  const { t } = useTranslation("account");
  const dispatch = useAppDispatch();
  const addresses = useAppSelector(selectAddresses);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SavedAddress | null>(null);
  const [label, setLabel] = useState("");

  if (!isAuthenticated) return null;

  const openNew = () => {
    setEditing(null);
    setLabel("");
    setFormOpen(true);
  };

  const openEdit = (address: SavedAddress) => {
    setEditing(address);
    setLabel(address.label);
    setFormOpen(true);
  };

  const handleSubmit = (address: ShippingAddress) => {
    if (editing) {
      dispatch(updateAddress({ ...editing, ...address, label: label.trim() || editing.label }));
    } else {
      dispatch(
        addAddress({
          label: label.trim() || "Address",
          address,
          isDefault: addresses.length === 0,
        })
      );
    }
    setFormOpen(false);
    setEditing(null);
    setLabel("");
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{t("addresses.title")}</h2>
        {!formOpen ? (
          <button
            type="button"
            onClick={openNew}
            className="h-10 rounded-[var(--radius-md)] border border-border px-4 text-sm font-medium text-foreground hover:bg-surface-hover"
          >
            {t("addresses.addNew")}
          </button>
        ) : null}
      </div>

      {formOpen ? (
        <div className="mb-8 rounded-[var(--radius-lg)] border border-border p-5">
          <div className="mb-4">
            <TextField
              id="address-label"
              label={t("addresses.labelField")}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <AddressForm
            initialValue={editing}
            onSubmit={handleSubmit}
            submitLabel={t("addresses.save")}
          />
          <button
            type="button"
            onClick={() => {
              setFormOpen(false);
              setEditing(null);
            }}
            className="mt-3 text-sm text-muted-foreground hover:text-foreground"
          >
            {t("addresses.cancel")}
          </button>
        </div>
      ) : null}

      {addresses.length === 0 && !formOpen ? (
        <EmptyState title={t("addresses.empty")} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <li key={address.id} className="rounded-[var(--radius-lg)] border border-border p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{address.label}</p>
                {address.isDefault ? (
                  <span className="flex items-center gap-1 text-xs text-accent">
                    <Star className="h-3 w-3 fill-accent" />
                    {t("addresses.default")}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {address.fullName}
                <br />
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}
                <br />
                {address.city}, {address.region} {address.postalCode}
                <br />
                {address.country}
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => openEdit(address)}
                  className="font-medium text-accent hover:underline"
                >
                  {t("addresses.edit")}
                </button>
                {!address.isDefault ? (
                  <button
                    type="button"
                    onClick={() => dispatch(setDefaultAddress(address.id))}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {t("addresses.setDefault")}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => dispatch(removeAddress(address.id))}
                  className="ms-auto text-danger hover:underline"
                >
                  {t("addresses.remove")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
