import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import LoginForm from "./components/LoginForm";
import OtpForm from "./components/OtpForm";

export default function LoginPage() {
  const [mobile, setMobile] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  return (
    <main className="flex w-full min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/60 md:grid-cols-2">
        <section className="hidden flex-col justify-between bg-indigo-700 p-10 text-white md:flex">
          <div className="py-12">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-200">
              Document Management System
            </p>
            <h1 className="text-4xl font-bold leading-tight">
              Your documents.
              <br />
              One secure space.
            </h1>
            <p className="mt-5 max-w-sm leading-7 text-indigo-100">
              Access, organize and manage your documents through one simple
              workspace.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-indigo-100">
            <ShieldCheck size={18} />
            Secure authentication
          </div>
        </section>

        <section className="px-6 py-10 sm:px-10 md:px-12 md:py-14">
          <p className="text-sm font-semibold text-indigo-600">WELCOME BACK</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {otpSent ? "Verify your OTP" : "Login in to your account"}
          </h2>
          <p className="mt-3 mb-8 text-sm leading-6 text-slate-500">
            {otpSent
              ? "Verify your mobile number to access your workspace."
              : "Enter your mobile number to receive a one-time password."}
          </p>

          {otpSent ? (
            <OtpForm
              mobile={mobile}
              onBack={() => setOtpSent(false)}
              onAuthenticated={() => {
                window.location.assign("/dashboard");
              }}
            />
          ) : (
            <LoginForm
              onOtpSent={(value) => {
                setMobile(value);
                setOtpSent(true);
              }}
            />
          )}

          <p className="mt-8 text-center text-xs leading-5 text-slate-400">
            Authentication is securely verified by the server.
          </p>
        </section>
      </div>
    </main>
  );
}
