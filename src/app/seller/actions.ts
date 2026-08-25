"use server";

import { sellerLoginAction, sellerRegisterAction } from "@/actions/auth-actions";

export async function sellerPortalLoginAction(formData: FormData) {
  await sellerLoginAction(null, formData);
}

export async function sellerPortalRegisterAction(formData: FormData) {
  await sellerRegisterAction(null, formData);
}
