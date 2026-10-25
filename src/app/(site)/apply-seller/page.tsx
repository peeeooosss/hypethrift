import { redirect } from "next/navigation";

export default async function ApplySellerPage() {
  redirect("/seller/register");
}