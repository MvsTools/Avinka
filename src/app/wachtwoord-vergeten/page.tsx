import Link from "next/link";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";
import Logo from "@/components/Logo";

export default function WachtwoordVergetenPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <Logo vol className="h-16 w-auto" priority />
      </Link>

      <ForgotPasswordForm />
    </div>
  );
}
