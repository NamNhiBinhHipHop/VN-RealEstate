const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

class ApiClient {
  private getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}/api${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new ApiError(response.status, data.error || 'An error occurred')
    }

    return data
  }

  // Auth endpoints
  async register(name: string, email: string, password: string): Promise<{ message: string; token: string; user: { id: string; name: string; email: string } }> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    })
  }

  async login(email: string, password: string): Promise<{ message: string; token: string; user: { id: string; name: string; email: string } }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  // Market data endpoints
  async getMarketData(city: string): Promise<{ city: string; properties: unknown[]; marketData: unknown[] }> {
    return this.request(`/market/${encodeURIComponent(city)}`)
  }

  // Investment calculation
  async calculateInvestment(input: Record<string, unknown>) {
    return this.request('/calc/investment', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  }

  // Scenario management
  async saveScenario(scenario: Record<string, unknown>) {
    return this.request('/scenario/save', {
      method: 'POST',
      body: JSON.stringify(scenario),
    })
  }

  async getScenarios(page: number = 1, limit: number = 10) {
    return this.request(`/scenario/list?page=${page}&limit=${limit}`)
  }

  async compareScenarios(scenarioIds: string[]) {
    return this.request('/scenario/compare', {
      method: 'POST',
      body: JSON.stringify({ scenarioIds }),
    })
  }
}

export const api = new ApiClient()

