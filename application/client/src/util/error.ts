import { AxiosError } from "axios";

const GENERIC_ERROR = "An unknown error occurred";

export const toErrorMessage = (potentialError: unknown): string => {
  if (potentialError instanceof AxiosError) {
    return potentialError?.response?.data?.error ?? GENERIC_ERROR;
  } else {
    const error = potentialError as Error;
    return error.message ?? GENERIC_ERROR;
  }
};
