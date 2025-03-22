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
}

interface ApiResponse<T = unknown> {
  data: T;
}

// Get base config with authorization
const getConfig = (): ApiConfig => {
  const token = localStorage.getItem("token");
  const config: ApiConfig = {
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
  return config;
};

// Main API function
const apiCall = async <T = unknown>(
  method: Method,
  url: string,
  data?: unknown,
  customConfig: Record<string, unknown> = {}
): Promise<T> => {
  const axiosConfig = getConfig();
  // Convert custom headers to string values to match ApiConfig type
  const customHeaders: Record<string, string> = {};
  Object.entries(customConfig).forEach(([key, value]) => {
    customHeaders[key] = String(value);
  });
  axiosConfig.headers = { ...axiosConfig.headers, ...customHeaders };

  try {
    const instance = axiosInstances;
    const fullUrl = `${baseUrl}/${url}`;
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
        console.log("401 error");
        // localStorage.clear();
        // window.location.href = window.location.origin;
        // window.location.reload();
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

// Main hook
export default function useApi<T = unknown>({
  key,
  method,
  url,
  customConfig,
}: ApiHookParams) {
  const queryClient = new QueryClient();

  switch (method) {
    case "GET": {
      const query = useQuery({
        queryKey: key,
        queryFn: async () => apiCall<T>(method, url),
        retry: 0,
        enabled: false,
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: true,
      });
      return { get: query };
    }

    case "POST": {
      const mutation = useMutation({
        mutationFn: (data: unknown) =>
          apiCall<T>(method, url, data, customConfig),
        retry: 0,

        onSuccess: (data: any) => {
          queryClient.invalidateQueries({ queryKey: key });
          data.message && toast(data.message, {});
        },
        onError: (error: any) => {
          console.log(error.message);
          (error.message || error.response?.data?.message) &&
            toast(error.message || error.response?.data?.message, {});
        },
      });

      const safePost = (data: unknown) => {
        if (!mutation.isPending) {
          mutation.mutate(data);
        }
      };

      return {
        post: {
          ...mutation,
          mutate: safePost,
        },
      };
    }

    case "PUT": {
      const mutation = useMutation({
        mutationFn: (data: { id: number } & Record<string, unknown>) =>
          apiCall<T>(method, `${url}/${data.id}`, data),
        retry: 0,

        onSuccess: (data: any) => {
          queryClient.invalidateQueries({ queryKey: key });
          data.message && toast(data.message, {});
        },
        onError: (error: any) => {
          console.log(error);
          error.response?.data?.message &&
            toast(error.response?.data?.message, {});
        },
      });
      return { put: mutation };
    }

    case "DELETE": {
      const mutation = useMutation({
        mutationFn: (id: string) => apiCall<T>(method, `${url}/${id}`),
        retry: 0,
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
