import AuthForm from "@/components/auth/AuthForm";
import { adminLoginAction } from "@/actions/auth-actions";

export default function AdminLoginPage() {
  return <AuthForm mode="login" portal="admin" action={adminLoginAction} />;
}
