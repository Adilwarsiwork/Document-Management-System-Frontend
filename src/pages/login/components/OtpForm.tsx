import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { otpSchema, type OtpFormValues } from "../schemas/auth.schema";
import { useGenerateOtp, useValidateOtp } from "../hooks/useAuth";
import type { ValidateOtpResponse } from "../types/auth.types";

interface Props {
  mobile: string;
  onBack: () => void;
  onAuthenticated: () => void;
}

const RESEND_DELAY = 30;

export default function OtpForm({ mobile, onBack, onAuthenticated }: Props) {
  const mutation = useValidateOtp();
  const resendMutation = useGenerateOtp();

  const [countdown, setCountdown] = useState(RESEND_DELAY);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = window.setTimeout(() => {
      setCountdown((previous) => previous - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [countdown]);

  const onSubmit = (values: OtpFormValues) => {
    mutation.mutate(
      { mobile_number: mobile, otp: values.otp },
      {
        onSuccess: (response: ValidateOtpResponse) => {
          const token = response.data?.token ?? "";

          if (!token) {
            // Do not authenticate if the expected token is missing.
            return;
          }

          sessionStorage.setItem("dms_token", token);
          onAuthenticated();
        },
      },
    );
  };

  const handleResendOtp = () => {
    if (countdown > 0 || resendMutation.isPending) return;

    resendMutation.mutate(
      { mobile_number: mobile },
      {
        onSuccess: () => {
          setCountdown(RESEND_DELAY);
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <p className="text-sm text-slate-600">
          Enter the OTP sent to +91 {mobile}
        </p>

        <label className="mb-2 mt-5 block text-sm font-medium text-slate-700">
          One-time password
        </label>

        <input
          {...register("otp")}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={8}
          placeholder="Enter OTP"
          className="w-full rounded-xl border border-slate-200 px-4 py-3.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />

        {errors.otp && (
          <p className="mt-1 text-sm text-red-600">{errors.otp.message}</p>
        )}
      </div>

      {mutation.isError && (
        <p role="alert" className="text-sm text-red-600">
          OTP verification failed. Please try again.
        </p>
      )}

      {mutation.isSuccess && !mutation.data.data?.token && (
        <p role="alert" className="text-sm text-red-600">
          The response did not contain a recognized token. Check the API
          response format.
        </p>
      )}

      {resendMutation.isError && (
        <p role="alert" className="text-sm text-red-600">
          Unable to resend OTP. Please try again.
        </p>
      )}

      {resendMutation.isSuccess && (
        <p role="status" className="text-sm text-emerald-600">
          OTP resend request completed.
        </p>
      )}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full rounded-xl bg-indigo-600 px-4 py-3.5 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {mutation.isPending ? "Verifying..." : "Verify OTP"}
      </button>

      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-slate-500">Didn't receive the OTP?</p>

        <button
          type="button"
          onClick={handleResendOtp}
          disabled={countdown > 0 || resendMutation.isPending}
          className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-700 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          {resendMutation.isPending
            ? "Resending OTP..."
            : countdown > 0
              ? `Resend OTP in ${countdown}s`
              : "Resend OTP"}
        </button>
      </div>

      <button
        type="button"
        onClick={onBack}
        className="w-full text-sm font-medium text-slate-600 hover:text-indigo-600"
      >
        Change mobile number
      </button>
    </form>
  );
}
