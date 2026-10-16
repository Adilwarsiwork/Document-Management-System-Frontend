import { apiClient } from "../../../services/api-client";

import type {
  GenerateOtpRequest,
  OtpResponse,
  ValidateOtpRequest,
  ValidateOtpResponse,
} from "../types/auth.types";

export async function generateOtp(
  payload: GenerateOtpRequest,
): Promise<OtpResponse> {
  const { data } = await apiClient.post<OtpResponse>("/generateOTP", payload);

  return data;
}

export async function validateOtp(
  payload: ValidateOtpRequest,
): Promise<ValidateOtpResponse> {
  const { data } = await apiClient.post<ValidateOtpResponse>(
    "/validateOTP",
    payload,
  );

  return data;
}
