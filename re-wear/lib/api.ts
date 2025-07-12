const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"

interface ApiResponse<T = any> {
  success: boolean
  message?: string
  error?: string
  data?: T
  [key: string]: any
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const config: RequestInit = {
    credentials: "include", // Include cookies for session-based auth
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  }

  // Remove Content-Type for FormData
  if (options.body instanceof FormData) {
    delete (config.headers as any)["Content-Type"]
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
    const data = await response.json()

    if (!response.ok) {
      throw new ApiError(data.message || `HTTP error! status: ${response.status}`, response.status, data)
    }

    return data
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    // Network or other errors
    throw new ApiError("Network error. Please check your connection and try again.", 0)
  }
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string, name: string) =>
    apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    }),

  logout: () =>
    apiRequest("/auth/logout", {
      method: "POST",
    }),

  getCurrentUser: () => apiRequest("/auth/me"),
}

// User API
export const userApi = {
  getProfile: () => apiRequest("/user/profile"),

  updateProfile: (data: any) =>
    apiRequest("/user/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  getUserItems: () => apiRequest("/items/user"),
}

// Items API
export const itemsApi = {
  getItems: (params: any = {}) => {
    const searchParams = new URLSearchParams()
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
        searchParams.append(key, params[key].toString())
      }
    })

    const queryString = searchParams.toString()
    return apiRequest(`/items${queryString ? `?${queryString}` : ""}`)
  },

  getItem: (id: number) => apiRequest(`/items/${id}`),

  createItem: (formData: FormData) =>
    apiRequest("/items", {
      method: "POST",
      body: formData,
    }),
}

// Categories API
export const categoriesApi = {
  getCategories: () => apiRequest("/categories"),
}

// Admin API
export const adminApi = {
  getPendingItems: () => apiRequest("/admin/items/pending"),

  getStats: () => apiRequest("/admin/stats"),

  approveItem: (id: number) =>
    apiRequest(`/admin/items/${id}/approve`, {
      method: "POST",
    }),

  rejectItem: (id: number, reason?: string) =>
    apiRequest(`/admin/items/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
}

export { ApiError }
