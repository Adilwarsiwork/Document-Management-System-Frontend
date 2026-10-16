import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck, Smartphone } from "lucide-react";
import { mobileSchema, type MobileFormValues } from "../schemas/auth.schema";
import { useGenerateOtp } from "../hooks/useAuth";

interface Props {
  onOtpSent: (mobile: string) => void;
}

export default function LoginForm({ onOtpSent }: Props) {
  const mutation = useGenerateOtp();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MobileFormValues>({
    resolver: zodResolver(mobileSchema),
    defaultValues: { mobile_number: "" },
  });

  const onSubmit = (values: MobileFormValues) => {
    mutation.mutate(values, {
      onSuccess: () => onOtpSent(values.mobile_number),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-800">
          Mobile number
        </label>

        <div className="flex h-14 items-center rounded-xl border border-slate-200 bg-slate-50 transition-all duration-200 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/10">
          <span className="ml-4 text-slate-400">
            <Smartphone size={19} strokeWidth={1.8} />
          </span>

          <span className="ml-3 border-r border-slate-300 pr-3 text-sm font-medium text-slate-700">
            +91
          </span>

          <input
            {...register("mobile_number")}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="00000 00000"
            maxLength={10}
            className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm font-medium tracking-wide text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400"
          />
        </div>

        {errors.mobile_number && (
          <p className="mt-2 text-xs font-medium text-red-600">
            {errors.mobile_number.message}
          </p>
        )}

        <p className="mt-2 text-xs text-slate-500">
          We'll send a one-time password to verify your number.
        </p>
      </div>

      {mutation.isError && (
        <div
          role="alert"
          className="rounded-lg border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {mutation.error instanceof Error
            ? mutation.error.message
            : "Unable to send OTP. Please try again."}
        </div>
      )}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {mutation.isPending ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Sending OTP...
          </>
        ) : (
          <>
            Get OTP
            <span aria-hidden="true">→</span>
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-2 pt-1 text-xs text-slate-400">
        <ShieldCheck size={14} className="mt-0.5" />
        <span>Secure OTP verification</span>
      </div>
    </form>
  );
}
