import { redirect } from "next/navigation";
import { ProductCreateForm } from "@/components/admin/product-create-form";
import { getStaff, isOwner } from "@/server/auth";

export default async function NewProductPage() {
  const staff = await getStaff();
  if (!staff) return null;
  if (!isOwner(staff.role)) redirect("/admin/products");
  return <ProductCreateForm />;
}
