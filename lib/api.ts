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
  email?: string;
  permission: number | null;
  club_id?: number | null;
}

export interface Club {
  id: number;
  name: string;
}

export interface Address {
  id: number;
  number: number;
  description: string;
  in_use: boolean;
  user_id: number;
  club_id?: number;
}

interface ApiResponse<T> {
  result?: T[];
  error?: string;
  created?: boolean;
  updated?: boolean;
  deleted?: boolean;
  joined?: boolean;
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
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: response.statusText };
        }
        const errorMessage = errorData.error || errorData.message || `API request failed with status ${response.status}`;
        console.error('API Error:', {
          url,
          status: response.status,
          error: errorMessage,
          body: options.body,
          fullResponse: errorData,
        });
        throw new Error(errorMessage);
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
      headers['authorization'] = `Bearer ${token}`;
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
    const response = await this.fetch<Appointment>('/appointments/', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
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
    const response = await this.fetch<Appointment>(`/appointments/${id}`, {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${token}`,
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
    const response = await this.fetch<Appointment>(`/appointments/${id}`, {
      method: 'DELETE',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    return {
      deleted: response.deleted || false,
    };
  }

  // Users API
  async getUsers(token: string): Promise<User[]> {
    const response = await this.fetch<User>('/users/', {
      method: 'GET',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    return response.result || [];
  }

  async getCurrentUser(token: string): Promise<User | null> {
    try {
      const response = await this.fetch<User>('/users/me', {
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      // Handle different response formats
      if ((response as any).user) {
        return (response as any).user as User;
      }
      if (response.result && response.result.length > 0) {
        return response.result[0];
      }
      return null;
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  }

  async getClerkUserInfo(clerkUserId: string): Promise<{ name?: string; email?: string }> {
    try {
      const response = await fetch(`/api/clerk-user/${encodeURIComponent(clerkUserId)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch Clerk user info');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching Clerk user info:', error);
      return {};
    }
  }

  async createUser(
    data: Omit<User, 'id'>,
    token: string
  ): Promise<{ created: boolean; id?: number }> {
    const response = await this.fetch<User>('/users/', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
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
  ): Promise<{ updated: boolean; clubId?: number | null }> {
    const response = await this.fetch<User>(`/users/${id}/`, {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    // Handle different response formats
    const updated = response.updated || (response as any).assigned || (response.result && response.result.length > 0) || ((response as any).user && !Array.isArray((response as any).user) && (response as any).user.id) || ((response as any).user && Array.isArray((response as any).user) && (response as any).user.length > 0);

    // Extract club_id from the clubs array if present
    let clubId: number | null | undefined = undefined;
    if ((response as any).clubs && Array.isArray((response as any).clubs)) {
      const clubAssignment = (response as any).clubs[0];
      if (clubAssignment) {
        clubId = clubAssignment.club_id;
      }
    }

    return {
      updated: !!updated,
      clubId,
    };
  }

  async removeUserFromClub(
    userId: number,
    clubId: number,
    token: string
  ): Promise<{ removed: boolean }> {
    const response = await this.fetch<any>(`/users/${userId}/clubs/${clubId}`, {
      method: 'DELETE',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    // Handle different response formats
    const removed = (response as any).removed || response.deleted || false;

    return {
      removed: !!removed,
    };
  }

  // Clubs API
  async getClubs(token: string): Promise<Club[]> {
    const response = await this.fetch<Club>('/clubs/', {
      method: 'GET',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    return response.result || [];
  }

  async createClub(
    data: Omit<Club, 'id'>,
    token: string
  ): Promise<{ created: boolean; id?: number }> {
    const response = await this.fetch<Club>('/clubs/', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    // The API returns { club: { data: [...] } } format
    const created = !!((response as any).club?.data && (response as any).club.data.length > 0);
    const id = created ? (response as any).club?.data?.[0]?.id : undefined;

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
    const response = await this.fetch<Club>(`/clubs/${id}`, {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${token}`,
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
    const response = await this.fetch<Club>(`/clubs/${id}`, {
      method: 'DELETE',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    return {
      deleted: response.deleted || false,
    };
  }

  async getClubById(id: number, token: string): Promise<Club | null> {
    const response = await this.fetch<Club>(`/clubs/${id}`, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    // Handle different response formats
    if ((response as any).club) {
      // If club is a single object (not an array)
      if (!Array.isArray((response as any).club) && typeof (response as any).club === 'object') {
        return (response as any).club as Club;
      }
      // If club is an array
      if (Array.isArray((response as any).club)) {
        return ((response as any).club[0] || null) as Club | null;
      }
      // If club has a nested data array
      if ((response as any).club.data && (response as any).club.data.length > 0) {
        return (response as any).club.data[0];
      }
    }
    if (response.result && response.result.length > 0) {
      return response.result[0];
    }
    return null;
  }

  async getClubUsers(clubId: number, token: string): Promise<User[]> {
    const response = await this.fetch<User>(`/clubs/${clubId}/users`, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    return response.result || [];
  }

  /**
   * Validate an invite token and get club information
   *
   * @param inviteToken - The invite token to validate
   * @param token - The user's authentication token
   * @returns Object with club info and validation status
   *
   * @throws Error if the API request fails
   *
   * @example
   * ```typescript
   * const result = await apiClient.validateInviteToken('abc123def456', userToken);
   * if (result.valid) {
   *   console.log('Club:', result.clubId, result.clubName);
   * } else {
   *   console.error('Invalid token:', result.error);
   * }
   * ```
   */
  async validateInviteToken(
    inviteToken: string,
    token: string
  ): Promise<{ valid: boolean; clubId?: number; clubName?: string; error?: string }> {
    try {
      const response = await this.fetch<any>(`/clubs/invite/validate?token=${encodeURIComponent(inviteToken)}`, {
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      if (response.error) {
        return {
          valid: false,
          error: response.error,
        };
      }

      // Check if response indicates valid token
      const isValid = (response as any).success;

      if (!isValid) {
        return {
          valid: false,
          error: 'Invalid token response from server',
        };
      }

      // Extract club info from nested club object
      const club = (response as any).club;
      let clubId: number | undefined;
      let clubName: string | undefined;

      if (club && typeof club === 'object') {
        clubId = club.id;
        clubName = club.name;
      } else {
        // Fallback to top-level fields
        clubId = (response as any).club_id || (response as any).clubId;
        clubName = (response as any).club_name || (response as any).clubName || (response as any).name;
      }

      if (clubId && clubName) {
        return {
          valid: true,
          clubId,
          clubName,
        };
      }

      return {
        valid: false,
        error: 'Missing club information in response',
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to validate invite token';
      return {
        valid: false,
        error: message,
      };
    }
  }

  /**
   * Join a club using an invite token
   *
   * @param clubId - The ID of the club to join
   * @param inviteToken - The invite token from the query parameter
   * @param token - The user's authentication token
   * @returns Object with joined status and error message if applicable
   *
   * @throws Error if the API request fails
   *
   * @example
   * ```typescript
   * const result = await apiClient.joinClubWithToken(5, 'abc123def456', userToken);
   * if (result.joined) {
   *   // User successfully joined the club
   * } else {
   *   console.error(result.error);
   * }
   * ```
   */
  async joinClubWithToken(
    clubId: number,
    inviteToken: string,
    token: string
  ): Promise<{ joined: boolean; error?: string }> {
    try {
      const response = await this.fetch<any>(`/clubs/${clubId}/join?invite=${encodeURIComponent(inviteToken)}`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      // Check if join was successful - backend returns { joined: true, club_id, user_id, club_name }
      const joined = !response.error && (response.joined || response.created || response.updated || !!(response.result && response.result.length > 0));

      return {
        joined,
        error: response.error,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join club';
      return {
        joined: false,
        error: message,
      };
    }
  }

  // Addresses API
  async getAddresses(token?: string): Promise<Address[]> {
    const headers: HeadersInit = {};
    if (token) {
      headers['authorization'] = `Bearer ${token}`;
    }

    const response = await this.fetch<Address>('/addresses/', {
      method: 'GET',
      headers,
    });

    return response.result || [];
  }

  async createAddress(
    data: Omit<Address, 'id'>,
    token: string
  ): Promise<{ created: boolean; id?: number }> {
    const response = await this.fetch<Address>('/addresses/', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    // Handle different response formats
    let created = false;
    let id: number | undefined = undefined;

    // Check if response.address.data exists (new format)
    if ((response as any).address?.data && Array.isArray((response as any).address.data)) {
      const addressData = (response as any).address.data[0];
      if (addressData?.id) {
        created = true;
        id = addressData.id;
      }
    }
    // Check other formats
    else if (response.created) {
      created = true;
      id = response.id;
    } else if ((response as any).address && !Array.isArray((response as any).address) && (response as any).address.id) {
      created = true;
      id = (response as any).address.id;
    } else if ((response as any).address && Array.isArray((response as any).address) && (response as any).address.length > 0) {
      created = true;
      id = (response as any).address[0]?.id;
    } else if ((response as any).result && Array.isArray((response as any).result) && (response as any).result.length > 0) {
      created = true;
      id = (response as any).result[0]?.id;
    }

    return {
      created: !!created,
      id,
    };
  }

  async updateAddress(
    id: number,
    data: Partial<Omit<Address, 'id'>>,
    token: string
  ): Promise<{ updated: boolean }> {
    const response = await this.fetch<Address>(`/addresses/${id}`, {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    // Handle different response formats
    let updated = false;

    // Check if response.address.data exists
    if ((response as any).address?.data && Array.isArray((response as any).address.data)) {
      updated = (response as any).address.data.length > 0;
    } else if (response.updated) {
      updated = true;
    } else if ((response as any).address && !Array.isArray((response as any).address) && (response as any).address.id) {
      updated = true;
    } else if ((response as any).address && Array.isArray((response as any).address)) {
      updated = (response as any).address.length > 0;
    }

    return {
      updated: !!updated,
    };
  }

  async deleteAddress(
    id: number,
    token: string
  ): Promise<{ deleted: boolean }> {
    const response = await this.fetch<Address>(`/addresses/${id}`, {
      method: 'DELETE',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    // Handle different response formats
    let deleted = false;

    // Check if response.address.data exists
    if ((response as any).address?.data && Array.isArray((response as any).address.data)) {
      deleted = (response as any).address.data.length > 0;
    } else if (response.deleted) {
      deleted = true;
    } else if ((response as any).address && !Array.isArray((response as any).address) && (response as any).address.id) {
      deleted = true;
    } else if ((response as any).address && Array.isArray((response as any).address)) {
      deleted = (response as any).address.length > 0;
    }

    return {
      deleted: !!deleted,
    };
  }

  // Invite Tokens API
  async createInviteToken(
    clubId: number,
    expiresAt: string | Date,
    token: string
  ): Promise<{ created: boolean; token?: string; error?: string }> {
    try {
      const response = await this.fetch<any>(`/clubs/${clubId}/invite-tokens`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          expiresAt: typeof expiresAt === 'string' ? expiresAt : expiresAt.toISOString(),
        }),
      });

      if (response.error) {
        return {
          created: false,
          error: response.error,
        };
      }

      return {
        created: !!(response as any).token,
        token: (response as any).token,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create invite token';
      return {
        created: false,
        error: message,
      };
    }
  }

  async getClubInviteTokens(
    clubId: number,
    token: string
  ): Promise<Array<{ token: string; expiresAt: string; createdAt?: string }>> {
    try {
      const response = await this.fetch<any>(`/clubs/${clubId}/invite-tokens`, {
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      if (response.error || !Array.isArray((response as any).tokens)) {
        return [];
      }

      return (response as any).tokens || [];
    } catch (err) {
      console.error('Error fetching invite tokens:', err);
      return [];
    }
  }

  async deleteInviteToken(
    clubId: number,
    inviteToken: string,
    token: string
  ): Promise<{ deleted: boolean; error?: string }> {
    try {
      const response = await this.fetch<any>(
        `/clubs/${clubId}/invite-tokens/${encodeURIComponent(inviteToken)}`,
        {
          method: 'DELETE',
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.error) {
        return {
          deleted: false,
          error: response.error,
        };
      }

      return {
        deleted: !!(response as any).deleted,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete invite token';
      return {
        deleted: false,
        error: message,
      };
    }
  }
}

export const apiClient = new ApiClient();
