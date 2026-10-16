import { useMutation } from "@tanstack/react-query";
import { generateOtp, validateOtp } from "../api/auth.api";

export function useGenerateOtp() {
  return useMutation({
    mutationFn: generateOtp,
  });
}

export function useValidateOtp() {
  return useMutation({
    mutationFn: validateOtp,
  });
}
