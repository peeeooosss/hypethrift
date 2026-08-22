import AuthForm from "@/components/auth/AuthForm";
import { loginAction } from "@/actions/auth-actions";

export default function LoginPage() {
  return <AuthForm mode="login" action={loginAction} />;
}
