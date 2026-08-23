import AuthForm from "@/components/auth/AuthForm";
import { sellerLoginAction } from "@/actions/auth-actions";

export default function SellerLoginPage() {
  return <AuthForm mode="login" portal="seller" action={sellerLoginAction} />;
}
