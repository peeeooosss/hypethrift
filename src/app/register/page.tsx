import AuthForm from "@/components/auth/AuthForm";
import { registerAction } from "@/actions/auth-actions";

export default function RegisterPage() {
  return <AuthForm mode="register" action={registerAction} />;
}
