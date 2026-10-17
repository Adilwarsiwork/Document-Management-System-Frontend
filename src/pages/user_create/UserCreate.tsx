import { useState } from "react";
import {
  UserPlus,
  UserRound,
  AtSign,
  Smartphone,
  LockKeyhole,
  ShieldCheck,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createUserSchema, type CreateUserValues } from "./schemas/user.schema";

export default function UserCreate() {
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registrationError, setRegistrationError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
  });

  type StoredUser = Pick<
    CreateUserValues,
    "name" | "username" | "mobileNumber"
  >;

  function onSubmit(values: CreateUserValues) {
    const newUser: StoredUser = {
      name: values.name.trim(),
      username: values.username.trim(),
      mobileNumber: values.mobileNumber.trim(),
    };

    let existingUsers: StoredUser[];

    try {
      existingUsers = JSON.parse(
        localStorage.getItem("registered_users") ?? "[]",
      );

      if (!Array.isArray(existingUsers)) {
        throw new Error("Invalid stored user data");
      }
    } catch {
      setRegistrationError(
        "Unable to read saved user records. Please check your browser storage.",
      );
      setSubmitted(false);
      return;
    }

    const duplicate = existingUsers.find(
      (user) =>
        user.name?.trim().toLowerCase() === newUser.name.toLowerCase() ||
        user.username?.trim().toLowerCase() ===
          newUser.username.toLowerCase() ||
        user.mobileNumber?.trim() === newUser.mobileNumber,
    );

    if (duplicate) {
      const duplicateField =
        duplicate.mobileNumber?.trim() === newUser.mobileNumber
          ? "Mobile number"
          : duplicate.username?.trim().toLowerCase() ===
              newUser.username.toLowerCase()
            ? "Username"
            : "Name";

      setRegistrationError(
        `${duplicateField} already exists. Please use different details.`,
      );
      setSubmitted(false);
      return;
    }

    try {
      localStorage.setItem(
        "registered_users",
        JSON.stringify([...existingUsers, newUser]),
      );

      setRegistrationError("");
      setSubmitted(true);
      reset();
      setShowPassword(false);
    } catch {
      setRegistrationError(
        "Unable to save user details. Please check your browser storage.",
      );
      setSubmitted(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

  return (
    <main className="min-h-dvh bg-slate-50 px-4 py-6 sm:px-6 sm:py-8 lg:py-14">
      <div className="mx-auto max-w-5xl">
        <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 sm:rounded-3xl lg:grid-cols-[0.85fr_1.15fr]">
          {/* Left panel */}
          <aside className="relative flex flex-col justify-between overflow-hidden bg-linear-to-br from-indigo-700 via-indigo-600 to-violet-700 p-6 text-white sm:p-10 lg:p-12">
            <div className="absolute -right-20 -top-20 size-64 rounded-full border border-white/10" />
            <div className="absolute -right-10 -top-10 size-44 rounded-full border border-white/10" />
            <div className="absolute -bottom-24 -left-16 size-64 rounded-full bg-white/5 blur-2xl" />

            <div className="relative">
              <div className="mb-6 flex size-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-sm sm:mb-8 sm:size-14">
                <UserPlus size={25} />
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-200">
                User Management
              </p>

              <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight sm:mt-4 sm:text-4xl">
                Create a new
                <br />
                user account.
              </h1>

              <p className="mt-4 max-w-sm text-sm leading-7 text-indigo-100 sm:mt-5">
                Set up user details securely with a simple, streamlined account
                creation experience.
              </p>
            </div>

            <div className="relative mt-8 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm sm:mt-12">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <ShieldCheck size={21} />
                </div>
                <div>
                  <p className="text-sm font-semibold">Secure by design</p>
                  <p className="mt-1 text-xs leading-5 text-indigo-100">
                    Provide the required details to validate your new user
                    account.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Form panel */}
          <section className="p-6 sm:p-10 lg:p-12">
            <div className="mb-8">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                <span className="size-1.5 rounded-full bg-indigo-500" />
                New account
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                User information
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Fill in the details below to continue.
              </p>
            </div>

            {registrationError && (
              <div
                role="alert"
                className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                <p className="font-semibold">Registration failed</p>
                <p className="mt-1">{registrationError}</p>
              </div>
            )}

            {submitted && (
              <div
                role="status"
                className="mb-6 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
              >
                <ShieldCheck className="mt-0.5 shrink-0" size={19} />
                <div>
                  <p className="font-semibold">User registered successfully!</p>
                  <p className="mt-1 text-xs">
                    User details have been saved successfully in this browser.
                  </p>
                </div>
              </div>
            )}

            <form
              onSubmit={handleSubmit(onSubmit)}
              onChange={() => {
                if (submitted) setSubmitted(false);
                if (registrationError) setRegistrationError("");
              }}
              className="space-y-5"
            >
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Full name
                </label>
                <div className="relative">
                  <UserRound
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="name"
                    {...register("name")}
                    autoComplete="name"
                    placeholder="Enter full name"
                    className={inputClass}
                  />
                </div>
                {errors.name && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Username */}
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Username
                </label>
                <div className="relative">
                  <AtSign
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="username"
                    {...register("username")}
                    autoComplete="username"
                    placeholder="Choose a username"
                    className={inputClass}
                  />
                </div>
                {errors.username && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Mobile Number */}
              <div>
                <label
                  htmlFor="mobileNumber"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Mobile number
                </label>
                <div className="relative">
                  <Smartphone
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="mobileNumber"
                    {...register("mobileNumber")}
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="Enter mobile number"
                    className={inputClass}
                  />
                </div>
                {errors.mobileNumber && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">
                    {errors.mobileNumber.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="password"
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                    className={`${inputClass} pr-12`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {errors.password && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-indigo-600/30 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 active:translate-y-0"
              >
                Validate user details
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>

              <p className="text-center text-xs leading-5 text-slate-400">
                All fields are validated before submission.
              </p>
            </form>

            <div className="mt-6 border-t border-slate-100 pt-5 text-center">
              <p className="text-sm text-slate-500">
                Already have an account?{" "}
                <Link
                  to="/login"
                  replace
                  className="font-semibold text-indigo-600 transition hover:text-indigo-700 hover:underline"
                >
                  Login
                </Link>
              </p>
            </div>
          </section>
        </div>

        <p className="mt-5 text-center text-xs text-slate-400">
          User Management · Account Setup
        </p>
      </div>
    </main>
  );
}
