import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import LoginForm from "./components/LoginForm";
import OtpForm from "./components/OtpForm";
import {
  clearSessionEndReason,
  getSessionEndReason,
} from "../../services/auth-session";

// How long the timeout notice stays on screen before it leaves on its own. Long
// enough to be read and acted on, short enough that it stops pushing the form
// down for the rest of the visit.
const NOTICE_DURATION_MS = 15 * 1000;

export default function LoginPage() {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  // Read through a lazy initializer rather than during render, so a second
  // render pass cannot land on a different answer than the first.
  const [timedOut, setTimedOut] = useState(
    () => getSessionEndReason() === "expired",
  );

  useEffect(() => {
    // The reason describes how this visit began, so it is dropped afterwards
    // and a reload lands on a plain login screen.
    clearSessionEndReason();
  }, []);

  useEffect(() => {
    if (!timedOut) return;

    // The notice only explains why the visitor landed back here. Once they have
    // seen it the form matters more than the explanation, so the timer is armed
    // only while the notice is showing and is cleared on unmount.
    const timer = window.setTimeout(
      () => setTimedOut(false),
      NOTICE_DURATION_MS,
    );

    return () => window.clearTimeout(timer);
  }, [timedOut]);

  return (
    <main className="flex min-h-dvh w-full items-center justify-center px-4 py-8 sm:py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl shadow-slate-200/60 sm:rounded-3xl md:grid-cols-2">
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

        <section className="px-6 py-9 sm:px-10 sm:py-10 md:px-12 md:py-14">
          <p className="text-sm font-semibold text-indigo-600">WELCOME BACK</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {otpSent ? "Verify your OTP" : "Login in to your account"}
          </h2>
          <p className="mt-3 mb-8 text-sm leading-6 text-slate-500">
            {otpSent
              ? "Verify your mobile number to access your workspace."
              : "Enter your mobile number to receive a one-time password."}
          </p>

          {timedOut && (
            <p
              role="status"
              className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800"
            >
              You were logged out after one hour. Log in again to continue.
            </p>
          )}

          {otpSent ? (
            <OtpForm
              mobile={mobile}
              onBack={() => setOtpSent(false)}
              onAuthenticated={() => {
                // Replace the login entry to prevent the Back button from returning to a screen the session no longer allows.
                navigate("/dashboard", { replace: true });
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

          <div className="mt-6 border-t border-slate-100 pt-5 text-center">
            <p className="text-sm text-slate-500">
              Don't have an account?{" "}
              <Link
                to="/register"
                replace
                className="font-semibold text-indigo-600 transition hover:text-indigo-700 hover:underline"
              >
                Register
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
