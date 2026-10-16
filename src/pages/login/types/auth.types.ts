export interface GenerateOtpRequest {
  mobile_number: string;
}

export interface ValidateOtpRequest {
  mobile_number: string;
  otp: string;
}

export interface GenerateOtpResponse {
  status: boolean;
  data: string;
}

export interface Role {
  id: number;
  role: string;
  role_slug: string;
  home: string;
}

export interface ValidateOtpResponse {
  status: boolean;
  data: {
    token: string;
    user_id: string;
    user_name: string;
    roles: Role[];
  };
}
