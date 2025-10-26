/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueryClient, useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

export const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

// Create separate axios instances for different base URLs
export const axiosInstances = axios.create({ baseURL: baseUrl });

export const config = () => {
  return {
    headers: {
      "Content-Type": "application/json",
      Authorization: "",
    },
  };
};
type Method = "GET" | "POST" | "PUT" | "DELETE";

interface ApiConfig {
  headers: {
    "Content-Type": string;
    Authorization: string;
    [key: string]: string;
  };
}

interface ApiHookParams {
  key: string[];
  method: Method;
  url: string;
  customConfig?: Record<string, unknown>;
  enabled?: boolean;
  validateParams?: () => boolean;
}

interface ApiResponse<T = unknown> {
  data: T;
}

// Get base config with authorization
const getConfig = (): ApiConfig => {
  // Don't try to access localStorage during SSR
  if (typeof window === "undefined") {
    return {
      headers: {
        "Content-Type": "application/json",
        Authorization: "",
      },
    };
  }

  const token = localStorage.getItem("token");
  if (token) {
    return {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    };
  }
  return {
    headers: {
      "Content-Type": "application/json",
      Authorization: "",
    },
  };
};

// Main API function
const apiCall = async <T = unknown>(
  method: Method,
  url: string,
  data?: unknown,
  customConfig: Record<string, unknown> = {}
): Promise<T> => {
  const axiosConfig = getConfig();
  const customHeaders: Record<string, string> = {};
  Object.entries(customConfig).forEach(([key, value]) => {
    customHeaders[key] = String(value);
  });
  axiosConfig.headers = { ...axiosConfig.headers, ...customHeaders };

  try {
    const instance = axiosInstances;
    const fullUrl = `${url}`;
    let response: ApiResponse<T>;

    switch (method) {
      case "GET":
        response = await instance.get(fullUrl, axiosConfig);
        break;
      case "POST":
        response = await instance.post(fullUrl, data, axiosConfig);
        break;
      case "PUT":
        response = await instance.put(fullUrl, data, axiosConfig);
        break;
      case "DELETE":
        response = await instance.delete(fullUrl, axiosConfig);
        break;
    }

    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 401) {
        if (typeof window !== "undefined") {
          localStorage.clear();
          // Dispatch custom event to notify components about token removal
          window.dispatchEvent(
            new CustomEvent("local-storage-change", {
              detail: { key: "token", value: null },
            })
          );
        }
      }

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Something went wrong";
      throw new Error(errorMessage);
    }
    throw error;
  }
};

// Create a singleton QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Main hook
export default function useApi<T = unknown>({
  key,
  method,
  url,
  customConfig,
  enabled = false,
  validateParams = () => true,
}: ApiHookParams) {
  const isEnabled = enabled && validateParams();

  switch (method) {
    case "GET": {
      const query = useQuery({
        queryKey: key,
        queryFn: async () => apiCall<T>(method, url),
        enabled: isEnabled,
      });

      return { get: query };
    }

    case "POST": {
      const mutation = useMutation({
        mutationFn: (data: unknown) =>
          apiCall<T>(method, url, data, customConfig),
        onSuccess: (data: any) => {
          queryClient.invalidateQueries({ queryKey: key });
          data.message && toast(data.message, {});
        },
        onError: (error: any) => {
          console.error(error.message);
          (error.message || error.response?.data?.message) &&
            toast(error.message || error.response?.data?.message, {});
        },
      });

      // Throttle mutation calls to prevent duplicate requests
      const mutateAsync = async (data: unknown) => {
        if (!mutation.isPending) {
          return mutation.mutateAsync(data);
        }
        return null;
      };

      return {
        post: {
          ...mutation,
          mutateAsync,
        },
      };
    }

    case "PUT": {
      const mutation = useMutation({
        mutationFn: (data: { id: number } & Record<string, unknown>) =>
          apiCall<T>(method, `${url}/${data.id}`, data),
        onSuccess: (data: any) => {
          queryClient.invalidateQueries({ queryKey: key });
          data.message && toast(data.message, {});
        },
        onError: (error: any) => {
          console.error(error);
          error.response?.data?.message &&
            toast(error.response?.data?.message, {});
        },
      });

      return { put: mutation };
    }

    case "DELETE": {
      const mutation = useMutation({
        mutationFn: (id: string) => apiCall<T>(method, `${url}/${id}`),
        onSuccess: (data: any) => {
          queryClient.invalidateQueries({ queryKey: key });
          data.message && toast(data.message, {});
        },
        onError: (error: any) => {
          error.response?.data?.message &&
            toast(error.response?.data?.message, {});
        },
      });

      return { delete: mutation };
    }

    default:
      throw new Error(`Invalid method ${method}`);
  }
}
