export interface Appointment {
  id: number;
  schedule: string;
  duration: number;
  user_id: number;
}

export interface User {
  id: number;
  token: string;
  name?: string;
  permission: number | null;
  club_id?: number | null;
}

export interface Club {
  id: number;
  name: string;
}

interface ApiResponse<T> {
  result?: T[];
  error?: string;
  created?: boolean;
  updated?: boolean;
  deleted?: boolean;
  id?: number;
  club?: {
    data?: T[];
    error?: string;
  } | T[]; // Can be either { data: [...] } or directly [...]
  address?: any;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
  }

  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Appointments API
  async getAppointments(token?: string): Promise<Appointment[]> {
    const headers: HeadersInit = {};
    if (token) {
      const authPayload = JSON.stringify({ jwt: token });
      headers['authorization'] = `Bearer ${authPayload}`;
    }

    const response = await this.fetch<Appointment>('/appointments/', {
      method: 'GET',
      headers,
    });

    return response.result || [];
  }

  async createAppointment(
    data: Omit<Appointment, 'id'>,
    token: string
  ): Promise<{ created: boolean; id?: number }> {
    const authPayload = JSON.stringify({ jwt: token });

    const response = await this.fetch<Appointment>('/appointments/', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${authPayload}`,
      },
      body: JSON.stringify(data),
    });

    return {
      created: response.created || false,
      id: response.id,
    };
  }

  async updateAppointment(
    id: number,
    data: Partial<Omit<Appointment, 'id'>>,
    token: string
  ): Promise<{ updated: boolean }> {
    const authPayload = JSON.stringify({ jwt: token });

    const response = await this.fetch<Appointment>(`/appointments/${id}`, {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${authPayload}`,
      },
      body: JSON.stringify(data),
    });

    return {
      updated: response.updated || false,
    };
  }

  async deleteAppointment(
    id: number,
    token: string
  ): Promise<{ deleted: boolean }> {
    const authPayload = JSON.stringify({ jwt: token });

    const response = await this.fetch<Appointment>(`/appointments/${id}`, {
      method: 'DELETE',
      headers: {
        authorization: `Bearer ${authPayload}`,
      },
    });

    return {
      deleted: response.deleted || false,
    };
  }

  // Users API
  async getUsers(token: string): Promise<User[]> {
    const authPayload = JSON.stringify({ jwt: token });

    const response = await this.fetch<User>('/users/', {
      method: 'GET',
      headers: {
        authorization: `Bearer ${authPayload}`,
      },
    });

    return response.result || [];
  }

  async createUser(
    data: Omit<User, 'id'>,
    token: string
  ): Promise<{ created: boolean; id?: number }> {
    const authPayload = JSON.stringify({ jwt: token });

    const response = await this.fetch<User>('/users/', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${authPayload}`,
      },
      body: JSON.stringify(data),
    });

    return {
      created: response.created || false,
      id: response.id,
    };
  }

  async updateUser(
    id: number,
    data: Partial<Omit<User, 'id'>>,
    token: string
  ): Promise<{ updated: boolean }> {
    const authPayload = JSON.stringify({ jwt: token });

    const response = await this.fetch<User>(`/users/${id}`, {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${authPayload}`,
      },
      body: JSON.stringify(data),
    });

    return {
      updated: response.updated || false,
    };
  }

  // Clubs API
  async getClubs(token: string): Promise<Club[]> {
    const authPayload = JSON.stringify({ jwt: token });

    const response = await this.fetch<Club>('/clubs/', {
      method: 'GET',
      headers: {
        authorization: `Bearer ${authPayload}`,
      },
    });

    return response.result || [];
  }

  async createClub(
    data: Omit<Club, 'id'>,
    token: string
  ): Promise<{ created: boolean; id?: number }> {
    const authPayload = JSON.stringify({ jwt: token });

    const response = await this.fetch<Club>('/clubs/', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${authPayload}`,
      },
      body: JSON.stringify(data),
    });

    // The API returns { club: { data: [...] } } format
    const created = !!(response.club?.data && response.club.data.length > 0);
    const id = created ? response.club?.data?.[0]?.id : undefined;

    return {
      created,
      id,
    };
  }

  async updateClub(
    id: number,
    data: Partial<Omit<Club, 'id'>>,
    token: string
  ): Promise<{ updated: boolean }> {
    const authPayload = JSON.stringify({ jwt: token });

    const response = await this.fetch<Club>(`/clubs/${id}`, {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${authPayload}`,
      },
      body: JSON.stringify(data),
    });

    // The API returns { club: [...] } format (array directly)
    const updated = !!(response.club && Array.isArray(response.club) && response.club.length > 0);

    return {
      updated,
    };
  }

  async deleteClub(
    id: number,
    token: string
  ): Promise<{ deleted: boolean }> {
    const authPayload = JSON.stringify({ jwt: token });

    const response = await this.fetch<Club>(`/clubs/${id}`, {
      method: 'DELETE',
      headers: {
        authorization: `Bearer ${authPayload}`,
      },
    });

    return {
      deleted: response.deleted || false,
    };
  }

  async getClubById(id: number, token: string): Promise<Club | null> {
    const authPayload = JSON.stringify({ jwt: token });

    const response = await this.fetch<Club>(`/clubs/${id}`, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${authPayload}`,
      },
    });

    // Handle different response formats
    if (response.club) {
      // If club is a single object (not an array)
      if (!Array.isArray(response.club) && typeof response.club === 'object') {
        return response.club as Club;
      }
      // If club is an array
      if (Array.isArray(response.club)) {
        return response.club[0] || null;
      }
      // If club has a nested data array
      if (response.club.data && response.club.data.length > 0) {
        return response.club.data[0];
      }
    }
    if (response.result && response.result.length > 0) {
      return response.result[0];
    }
    return null;
  }

  async getClubUsers(clubId: number, token: string): Promise<User[]> {
    const authPayload = JSON.stringify({ jwt: token });

    const response = await this.fetch<User>(`/clubs/${clubId}/users`, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${authPayload}`,
      },
    });

    return response.result || [];
  }
}

export const apiClient = new ApiClient();
