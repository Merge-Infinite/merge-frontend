import { getAuthToken, handleAuthError, isTokenExpired } from "@/utils/api";
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { toast } from "sonner";

// Define custom error interface for better typing
export interface ApiError extends Error {
  status?: number;
  data?: any;
  isAxiosError: boolean;
}

// Create API client class
class ApiClient {
  private client: AxiosInstance;
  private static instance: ApiClient;

  private constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "",
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Setup request interceptor
    this.client.interceptors.request.use(
      this.handleRequest,
      this.handleRequestError
    );

    // Setup response interceptor
    this.client.interceptors.response.use(
      this.handleResponse,
      this.handleResponseError
    );
  }

  // Get singleton instance
  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  // Handle request interceptor
  private handleRequest = (
    config: InternalAxiosRequestConfig
  ): InternalAxiosRequestConfig => {
    // Get token from storage
    const token = getAuthToken();

    // Add authorization header if token exists
    if (token) {
      // Check if token is expired
      if (isTokenExpired(token)) {
        // Handle expired token
        handleAuthError();
        throw new Error("Auth token expired");
      }

      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  };

  // Handle request error
  private handleRequestError = (error: AxiosError): Promise<AxiosError> => {
    console.log(error);
    if (error.message) {
      toast.error(error.message);
    }
    return Promise.reject(error);
  };

  // Handle response
  private handleResponse = (response: AxiosResponse): any => {
    // Return only the data portion of the response
    console.log("response", response);
    try {
      if (response.data.message) {
        toast.success(response.data.message);
      }
      return response.data;
    } catch (error) {
      console.error(error);
      return response;
    }
  };

  // Handle response error
  private handleResponseError = (error: AxiosError): Promise<ApiError> => {
    console.log("error", error);

    // Handle authentication errors
    if (error.response?.status === 401) {
      handleAuthError();
    }

    toast.error(
      (error.response?.data as any)?.message ||
        (error.response?.data as any)?.error?.message ||
        error.message
    );
    // Enhance error object with status and data
    const enhancedError: ApiError = {
      ...error,
      status: error.response?.status,
      data: error.response?.data,
      isAxiosError: true,
    };

    return Promise.reject(enhancedError);
  };

  // Generic request method
  public async request<T>(config: AxiosRequestConfig): Promise<T> {
    return this.client.request(config);
  }

  // GET method
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.get(url, config);
  }

  // POST method
  public async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.client.post(url, data, config);
  }

  // PUT method
  public async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.client.put(url, data, config);
  }

  // PATCH method
  public async patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.client.patch(url, data, config);
  }

  // DELETE method
  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.delete(url, config);
  }
}

// Export a singleton instance
export const api = ApiClient.getInstance();

// Export default for direct import
export default api;
