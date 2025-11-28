export interface Appointment {
  id: number;
  schedule: string;
  duration: number;
  user_id: number;
  scheduled_session_id?: number;
}

/**
 * Represents a user in the Locomotive House system
 *
 * User data is primarily stored in the backend database with first_name/last_name
 * being synced from Clerk during profile completion. The 'name' field is kept
 * for backwards compatibility.
 *
 * @property id - Database user ID
 * @property token - Clerk user ID (used as the token/identifier)
 * @property first_name - User's first name (from Clerk profile, synced to DB)
 * @property last_name - User's last name (from Clerk profile, synced to DB)
 * @property email - User's email address (from Clerk, stored in DB)
 * @property name - Full name or display name (deprecated, use first_name/last_name instead)
 * @property permission - Permission level: 1 = Admin, 2 = Regular, 3 = Super Admin
 * @property clubs - Array of club assignments for this user
 */
export interface User {
  /** Database user ID */
  id: number;

  /** Clerk user ID (used as token for authentication) */
  token: string;

  /** User's first name (from Clerk profile, synced after profile completion) */
  first_name?: string;

  /** User's last name (from Clerk profile, synced after profile completion) */
  last_name?: string;

  /** User's email address */
  email?: string;

  /** Full name or display name (deprecated - use firstName + lastName instead) */
  name?: string;

  /** Permission level (null, 1=Admin, 2=Regular, 3=Super Admin) */
  permission: number | null;

  /** Array of clubs this user is assigned to */
  clubs: UserClubRelation[] | null;
}

export interface Club {
  id: number;
  name: string;
}

export interface UserClubRelation {
  user_id?: number;
  club_id: number;
}

export interface Address {
  id: number;
  number: number;
  description: string;
  in_use: boolean;
  user_id: number;
  club_id?: number;
}

export interface Tower {
  id: number;
  name: string;
  description?: string;
  club_id: number;
  owner_id?: number;
}

export interface ScheduledSession {
  id: number;
  schedule: string | Date;
  club_id: number;
  description?: string;
}

export interface Notice {
  id: number;
  club_id: number;
  description: string;
  type?: string;
  expires_at?: string | Date;
  created_at?: string;
  updated_at?: string;
}

export interface TowerReport {
  id: number;
  tower_id: number;
  club_id?: number;
  user_id?: number;
  description?: string;
  report_at?: string | Date;
  created_at?: string;
  updated_at?: string;
}

export type IssueStatus = "Open" | "In Progress" | "Done" | "Closed";

export interface Issue {
  id: number;
  tower_id: number;
  user_id: number;
  title: string;
  type: string;
  description?: string;
  status: IssueStatus;
  created_at?: string;
  updated_at?: string;
}

interface ApiResponse<T> {
  result?: T[];
  error?: string;
  created?: boolean;
  updated?: boolean;
  deleted?: boolean;
  joined?: boolean;
  id?: number;
  club?:
    | {
        data?: T[];
        error?: string;
      }
    | T[]; // Can be either { data: [...] } or directly [...]
  address?: any;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
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
          "Content-Type": "application/json",
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
        let errorMessage =
          errorData.error ||
          errorData.message ||
          `API request failed with status ${response.status}`;

        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  // Appointments API
  async getAppointments(token?: string): Promise<Appointment[]> {
    const headers: HeadersInit = {};
    if (token) {
      headers["authorization"] = `Bearer ${token}`;
    }

    const response = await this.fetch<Appointment>("/appointments/", {
      method: "GET",
      headers,
    });

    return response.result || [];
  }

  async getClubAppointments(
    clubId: number,
    token?: string
  ): Promise<Appointment[]> {
    const headers: HeadersInit = {};
    if (token) {
      headers["authorization"] = `Bearer ${token}`;
    }

    const response = await this.fetch<Appointment>(
      `/clubs/${clubId}/appointments`,
      {
        method: "GET",
        headers,
      }
    );

    // Backend returns { appointments: [...] } for club-scoped appointments
    return (response as any).appointments || response.result || [];
  }

  async createAppointment(
    data: Omit<Appointment, "id">,
    token: string
  ): Promise<{ created: boolean; id?: number }> {
    const response = await this.fetch<Appointment>("/appointments/", {
      method: "POST",
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
    data: Partial<Omit<Appointment, "id">>,
    token: string
  ): Promise<{ updated: boolean }> {
    const response = await this.fetch<Appointment>(`/appointments/${id}`, {
      method: "PUT",
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
      method: "DELETE",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    return {
      deleted: response.deleted || false,
    };
  }

  async getScheduledSessionAppointments(
    clubId: number,
    sessionId: number,
    token?: string
  ): Promise<Appointment[]> {
    const headers: HeadersInit = {};
    if (token) {
      headers["authorization"] = `Bearer ${token}`;
    }

    const response = await this.fetch<Appointment>(
      `/clubs/${clubId}/scheduled-sessions/${sessionId}/appointments`,
      {
        method: "GET",
        headers,
      }
    );

    // Backend returns { appointments: [...] } for this endpoint
    return (response as any).appointments || response.result || [];
  }

  // Users API
  async getUsers(token: string): Promise<User[]> {
    const response = await this.fetch<User>("/users", {
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    return response.result || [];
  }

  async getCurrentUser(token: string): Promise<User | null> {
    try {
      const response = await this.fetch<User>("/users/me", {
        method: "GET",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      // Handle different response formats
      let user: any = null;

      if ((response as any).user) {
        user = (response as any).user;
      } else if (response.result && response.result.length > 0) {
        user = response.result[0];
      }

      if (!user) {
        return null;
      }

      // Use the snake_case fields from backend
      const convertedUser: User = {
        id: user.id,
        token: user.token,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        name: user.name,
        permission: user.permission,
        clubs: user.clubs,
      };

      return convertedUser;
    } catch (error) {
      console.error("Error fetching current user:", error);
      return null;
    }
  }

  async getClerkUserInfo(
    clerkUserId: string
  ): Promise<{ name?: string; email?: string }> {
    try {
      const response = await fetch(
        `/api/clerk-user/${encodeURIComponent(clerkUserId)}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch Clerk user info");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching Clerk user info:", error);
      return {};
    }
  }

  async createUser(
    data: Omit<User, "id">,
    token: string
  ): Promise<{ created: boolean; id?: number }> {
    const response = await this.fetch<User>("/users/", {
      method: "POST",
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
    data: Partial<Omit<User, "id">>,
    token: string
  ): Promise<{ updated: boolean; clubId?: number | null }> {
    const response = await this.fetch<User>(`/users/${id}`, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    // Handle different response formats
    const updated =
      response.updated ||
      (response as any).assigned ||
      (response.result && response.result.length > 0) ||
      ((response as any).user &&
        !Array.isArray((response as any).user) &&
        (response as any).user.id) ||
      ((response as any).user &&
        Array.isArray((response as any).user) &&
        (response as any).user.length > 0);

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
    const response = await this.fetch<any>(`/clubs/${clubId}/users/${userId}`, {
      method: "DELETE",
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
    const response = await this.fetch<Club>("/clubs/", {
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    return response.result || [];
  }

  async createClub(
    data: Omit<Club, "id">,
    token: string
  ): Promise<{ created: boolean; id?: number }> {
    const response = await this.fetch<Club>("/clubs/", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    // The API returns { club: { data: [...] } } format
    const created = !!(
      (response as any).club?.data && (response as any).club.data.length > 0
    );
    const id = created ? (response as any).club?.data?.[0]?.id : undefined;

    return {
      created,
      id,
    };
  }

  async updateClub(
    id: number,
    data: Partial<Omit<Club, "id">>,
    token: string
  ): Promise<{ updated: boolean }> {
    const response = await this.fetch<Club>(`/clubs/${id}`, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    // The API returns { club: [...] } format (array directly)
    const updated = !!(
      response.club &&
      Array.isArray(response.club) &&
      response.club.length > 0
    );

    return {
      updated,
    };
  }

  async deleteClub(id: number, token: string): Promise<{ deleted: boolean }> {
    const response = await this.fetch<Club>(`/clubs/${id}`, {
      method: "DELETE",
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
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    // Handle different response formats
    if ((response as any).club) {
      // If club is a single object (not an array)
      if (
        !Array.isArray((response as any).club) &&
        typeof (response as any).club === "object"
      ) {
        return (response as any).club as Club;
      }
      // If club is an array
      if (Array.isArray((response as any).club)) {
        return ((response as any).club[0] || null) as Club | null;
      }
      // If club has a nested data array
      if (
        (response as any).club.data &&
        (response as any).club.data.length > 0
      ) {
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
      method: "GET",
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
  ): Promise<{
    valid: boolean;
    clubId?: number;
    clubName?: string;
    error?: string;
  }> {
    try {
      const response = await this.fetch<any>(
        `/clubs/invite/validate?token=${encodeURIComponent(inviteToken)}`,
        {
          method: "GET",
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.error) {
        return {
          valid: false,
          error: response.error,
        };
      }

      // Check if response indicates valid token
      const isValid = (response as any).valid;

      if (!isValid) {
        return {
          valid: false,
          error: "Invalid token response from server",
        };
      }

      // Extract club info from nested club object
      const club = (response as any).club;
      let clubId: number | undefined;
      let clubName: string | undefined;

      if (club && typeof club === "object") {
        clubId = club.id;
        clubName = club.name;
      } else {
        // Fallback to top-level fields
        clubId = (response as any).club_id || (response as any).clubId;
        clubName =
          (response as any).club_name ||
          (response as any).clubName ||
          (response as any).name;
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
        error: "Missing club information in response",
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to validate invite token";
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
    token: string,
    rolePermission?: number
  ): Promise<{ joined: boolean; error?: string }> {
    try {
      const body: any = {};

      // Include role permission if specified
      if (rolePermission !== undefined) {
        body.rolePermission = rolePermission;
      }

      const response = await this.fetch<any>(
        `/clubs/${clubId}/join?invite=${encodeURIComponent(inviteToken)}`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${token}`,
          },
          body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
        }
      );

      // Check if join was successful - backend returns { joined: true, club_id, user_id, club_name }
      const joined =
        !response.error &&
        (response.joined ||
          response.created ||
          response.updated ||
          !!(response.result && response.result.length > 0));

      return {
        joined,
        error: response.error,
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to join club";
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
      headers["authorization"] = `Bearer ${token}`;
    }

    const response = await this.fetch<Address>("/addresses/", {
      method: "GET",
      headers,
    });

    return response.result || [];
  }

  async getClubAddresses(clubId: number, token?: string): Promise<Address[]> {
    const headers: HeadersInit = {};
    if (token) {
      headers["authorization"] = `Bearer ${token}`;
    }

    const response = await this.fetch<Address>(`/clubs/${clubId}/addresses`, {
      method: "GET",
      headers,
    });

    // Backend returns { addresses: [...] } for club-scoped addresses
    return (response as any).addresses || response.result || [];
  }

  async createAddress(
    data: Omit<Address, "id">,
    token: string
  ): Promise<{ created: boolean; id?: number }> {
    const response = await this.fetch<Address>("/addresses/", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    // Handle different response formats
    let created = false;
    let id: number | undefined = undefined;

    // Check if response.address.data exists (new format)
    if (
      (response as any).address?.data &&
      Array.isArray((response as any).address.data)
    ) {
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
    } else if (
      (response as any).address &&
      !Array.isArray((response as any).address) &&
      (response as any).address.id
    ) {
      created = true;
      id = (response as any).address.id;
    } else if (
      (response as any).address &&
      Array.isArray((response as any).address) &&
      (response as any).address.length > 0
    ) {
      created = true;
      id = (response as any).address[0]?.id;
    } else if (
      (response as any).result &&
      Array.isArray((response as any).result) &&
      (response as any).result.length > 0
    ) {
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
    data: Partial<Omit<Address, "id">>,
    token: string
  ): Promise<{ updated: boolean }> {
    const response = await this.fetch<Address>(`/addresses/${id}`, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    // Handle different response formats
    let updated = false;

    // Check if response.address.data exists
    if (
      (response as any).address?.data &&
      Array.isArray((response as any).address.data)
    ) {
      updated = (response as any).address.data.length > 0;
    } else if (response.updated) {
      updated = true;
    } else if (
      (response as any).address &&
      !Array.isArray((response as any).address) &&
      (response as any).address.id
    ) {
      updated = true;
    } else if (
      (response as any).address &&
      Array.isArray((response as any).address)
    ) {
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
      method: "DELETE",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    // Handle different response formats
    let deleted = false;

    // Check if response.address.data exists
    if (
      (response as any).address?.data &&
      Array.isArray((response as any).address.data)
    ) {
      deleted = (response as any).address.data.length > 0;
    } else if (response.deleted) {
      deleted = true;
    } else if (
      (response as any).address &&
      !Array.isArray((response as any).address) &&
      (response as any).address.id
    ) {
      deleted = true;
    } else if (
      (response as any).address &&
      Array.isArray((response as any).address)
    ) {
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
    token: string,
    rolePermission?: number
  ): Promise<{ created: boolean; token?: string; error?: string }> {
    try {
      const body: any = {
        expiresAt:
          typeof expiresAt === "string" ? expiresAt : expiresAt.toISOString(),
      };

      // Include role permission if specified
      if (rolePermission !== undefined) {
        body.rolePermission = rolePermission;
      }

      const response = await this.fetch<any>(`/clubs/${clubId}/invite-tokens`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
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
      const message =
        err instanceof Error ? err.message : "Failed to create invite token";
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
        method: "GET",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      if (response.error || !Array.isArray((response as any).tokens)) {
        return [];
      }

      // Transform snake_case API response to camelCase
      const tokens = (response as any).tokens || [];
      return tokens.map((token: any) => ({
        token: token.token,
        expiresAt: token.expires_at,
        createdAt: token.created_at,
      }));
    } catch (err) {
      console.error("Error fetching invite tokens:", err);
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
          method: "DELETE",
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
      const message =
        err instanceof Error ? err.message : "Failed to delete invite token";
      return {
        deleted: false,
        error: message,
      };
    }
  }

  // Towers API
  async getTowersByClubId(clubId: number, token?: string): Promise<Tower[]> {
    const headers: HeadersInit = {};
    if (token) {
      headers["authorization"] = `Bearer ${token}`;
    }

    const response = await this.fetch<Tower>(`/clubs/${clubId}/towers`, {
      method: "GET",
      headers,
    });

    // Backend returns { result: [...] } for club-scoped towers
    return response.result || [];
  }

  async getTowerById(
    clubId: number,
    towerId: number,
    token?: string
  ): Promise<Tower | null> {
    const headers: HeadersInit = {};
    if (token) {
      headers["authorization"] = `Bearer ${token}`;
    }

    const response = await this.fetch<Tower>(
      `/clubs/${clubId}/towers/${towerId}`,
      {
        method: "GET",
        headers,
      }
    );

    // Handle different response formats
    if ((response as any).tower) {
      return (response as any).tower;
    } else if (response.result && response.result.length > 0) {
      return response.result[0];
    }

    return null;
  }

  async createTower(
    clubId: number,
    data: Omit<Tower, "id" | "club_id">,
    token: string
  ): Promise<{ created: boolean; id?: number }> {
    const towerData = {
      ...data,
      club_id: clubId,
    };

    const response = await this.fetch<Tower>(`/clubs/${clubId}/towers`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(towerData),
    });

    // Handle different response formats
    let created = false;
    let id: number | undefined = undefined;

    if (response.created) {
      created = true;
      id = response.id;
    } else if (
      (response as any).tower?.data &&
      Array.isArray((response as any).tower.data)
    ) {
      const towerData = (response as any).tower.data[0];
      if (towerData?.id) {
        created = true;
        id = towerData.id;
      }
    } else if (
      (response as any).result &&
      Array.isArray((response as any).result) &&
      (response as any).result.length > 0
    ) {
      created = true;
      id = (response as any).result[0]?.id;
    }

    return {
      created: !!created,
      id,
    };
  }

  async updateTower(
    clubId: number,
    towerId: number,
    data: Partial<Omit<Tower, "id">>,
    token: string
  ): Promise<{ updated: boolean }> {
    const response = await this.fetch<Tower>(
      `/clubs/${clubId}/towers/${towerId}`,
      {
        method: "PUT",
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }
    );

    // Handle different response formats
    let updated = false;

    if (response.updated) {
      updated = true;
    } else if (
      (response as any).tower?.data &&
      Array.isArray((response as any).tower.data)
    ) {
      updated = (response as any).tower.data.length > 0;
    } else if (
      (response as any).tower &&
      !Array.isArray((response as any).tower)
    ) {
      updated = true;
    }

    return {
      updated: !!updated,
    };
  }

  async deleteTower(
    clubId: number,
    towerId: number,
    token: string
  ): Promise<{ deleted: boolean }> {
    const response = await this.fetch<Tower>(
      `/clubs/${clubId}/towers/${towerId}`,
      {
        method: "DELETE",
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );

    // Handle different response formats
    let deleted = false;

    if (response.deleted) {
      deleted = true;
    } else if (
      (response as any).tower?.data &&
      Array.isArray((response as any).tower.data)
    ) {
      deleted = (response as any).tower.data.length > 0;
    } else if (
      (response as any).tower &&
      !Array.isArray((response as any).tower)
    ) {
      deleted = true;
    }

    return {
      deleted: !!deleted,
    };
  }

  // Tower Reports API
  async getTowerReportsByClubId(
    clubId: number,
    token?: string
  ): Promise<TowerReport[]> {
    const headers: HeadersInit = {};
    if (token) {
      headers["authorization"] = `Bearer ${token}`;
    }

    const response = await this.fetch<TowerReport>(`/clubs/${clubId}/reports`, {
      method: "GET",
      headers,
    });

    // Backend returns { result: [...] } for club-scoped reports
    return response.result || [];
  }

  async getTowerReportsByTowerId(
    clubId: number,
    towerId: number,
    token?: string
  ): Promise<TowerReport[]> {
    const headers: HeadersInit = {};
    if (token) {
      headers["authorization"] = `Bearer ${token}`;
    }

    const response = await this.fetch<TowerReport>(
      `/clubs/${clubId}/towers/${towerId}/reports`,
      {
        method: "GET",
        headers,
      }
    );

    return response.result || [];
  }

  async getTowerReportById(
    clubId: number,
    towerId: number,
    reportId: number,
    token?: string
  ): Promise<TowerReport | null> {
    const headers: HeadersInit = {};
    if (token) {
      headers["authorization"] = `Bearer ${token}`;
    }

    const response = await this.fetch<TowerReport>(
      `/clubs/${clubId}/towers/${towerId}/reports/${reportId}`,
      {
        method: "GET",
        headers,
      }
    );

    // Handle different response formats
    if ((response as any).report) {
      return (response as any).report;
    } else if (response.result && response.result.length > 0) {
      return response.result[0];
    }

    return null;
  }

  async createTowerReport(
    clubId: number,
    towerId: number,
    data: Omit<TowerReport, "id" | "club_id" | "created_at" | "updated_at"> & {
      user_id: number;
    },
    token: string
  ): Promise<{ created: boolean; id?: number }> {
    // Send description, report_at, tower_id, and user_id to backend
    const reportData = {
      tower_id: towerId,
      user_id: data.user_id,
      ...(data.description && { description: data.description }),
      ...(data.report_at && { report_at: data.report_at }),
    };

    const response = await this.fetch<TowerReport>(
      `/clubs/${clubId}/towers/${towerId}/reports`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reportData),
      }
    );

    // Handle different response formats
    let created = false;
    let id: number | undefined = undefined;

    if (response.created) {
      created = true;
      id = response.id;
    } else if (
      (response as any).report?.data &&
      Array.isArray((response as any).report.data)
    ) {
      const reportData = (response as any).report.data[0];
      if (reportData?.id) {
        created = true;
        id = reportData.id;
      }
    } else if (
      (response as any).result &&
      Array.isArray((response as any).result) &&
      (response as any).result.length > 0
    ) {
      created = true;
      id = (response as any).result[0]?.id;
    }

    return {
      created: !!created,
      id,
    };
  }

  async updateTowerReport(
    clubId: number,
    towerId: number,
    reportId: number,
    data: Partial<
      Omit<
        TowerReport,
        "id" | "tower_id" | "club_id" | "created_at" | "updated_at"
      >
    >,
    token: string
  ): Promise<{ updated: boolean }> {
    const response = await this.fetch<TowerReport>(
      `/clubs/${clubId}/towers/${towerId}/reports/${reportId}`,
      {
        method: "PUT",
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }
    );

    // Handle different response formats
    let updated = false;

    if (response.updated) {
      updated = true;
    } else if (
      (response as any).report?.data &&
      Array.isArray((response as any).report.data)
    ) {
      updated = (response as any).report.data.length > 0;
    } else if (
      (response as any).report &&
      !Array.isArray((response as any).report)
    ) {
      updated = true;
    }

    return {
      updated: !!updated,
    };
  }

  async deleteTowerReport(
    clubId: number,
    towerId: number,
    reportId: number,
    token: string
  ): Promise<{ deleted: boolean }> {
    const response = await this.fetch<TowerReport>(
      `/clubs/${clubId}/towers/${towerId}/reports/${reportId}`,
      {
        method: "DELETE",
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );

    // Handle different response formats
    let deleted = false;

    if (response.deleted) {
      deleted = true;
    } else if (
      (response as any).report?.data &&
      Array.isArray((response as any).report.data)
    ) {
      deleted = (response as any).report.data.length > 0;
    } else if (
      (response as any).report &&
      !Array.isArray((response as any).report)
    ) {
      deleted = true;
    }

    return {
      deleted: !!deleted,
    };
  }

  // Issues API
  /**
   * Fetch all issues for a specific tower
   * @param clubId - The club ID
   * @param towerId - The tower ID
   * @param token - Authentication token
   * @returns Array of issues for the tower
   */
  async getIssuesByTowerId(
    clubId: number,
    towerId: number,
    token?: string
  ): Promise<Issue[]> {
    const headers: HeadersInit = {};
    if (token) {
      headers["authorization"] = `Bearer ${token}`;
    }

    const response = await this.fetch<Issue>(
      `/clubs/${clubId}/towers/${towerId}/issues`,
      {
        method: "GET",
        headers,
      }
    );

    return response.result || [];
  }

  /**
   * Fetch a single issue by ID
   * @param clubId - The club ID
   * @param towerId - The tower ID
   * @param issueId - The issue ID
   * @param token - Authentication token
   * @returns Single issue or null if not found
   */
  async getIssueById(
    clubId: number,
    towerId: number,
    issueId: number,
    token?: string
  ): Promise<Issue | null> {
    const headers: HeadersInit = {};
    if (token) {
      headers["authorization"] = `Bearer ${token}`;
    }

    const response = await this.fetch<Issue>(
      `/clubs/${clubId}/towers/${towerId}/issues/${issueId}`,
      {
        method: "GET",
        headers,
      }
    );

    if ((response as any).issue) {
      return (response as any).issue;
    } else if (response.result && response.result.length > 0) {
      return response.result[0];
    }

    return null;
  }

  /**
   * Create a new issue for a tower
   * @param clubId - The club ID
   * @param towerId - The tower ID
   * @param data - Issue data (title, type, description, status, user_id)
   * @param token - Authentication token
   * @returns Object with created flag and issue ID
   */
  async createIssue(
    clubId: number,
    towerId: number,
    data: Omit<Issue, "id" | "tower_id" | "created_at" | "updated_at">,
    token: string
  ): Promise<{ created: boolean; id?: number }> {
    const issueData = {
      ...data,
      tower_id: towerId,
    };

    const response = await this.fetch<Issue>(
      `/clubs/${clubId}/towers/${towerId}/issues`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(issueData),
      }
    );

    // Handle different response formats
    let created = false;
    let id: number | undefined = undefined;

    if (response.created) {
      created = true;
      id = response.id;
    } else if (
      (response as any).issue?.data &&
      Array.isArray((response as any).issue.data)
    ) {
      const issueData = (response as any).issue.data[0];
      if (issueData?.id) {
        created = true;
        id = issueData.id;
      }
    } else if (
      (response as any).result &&
      Array.isArray((response as any).result) &&
      (response as any).result.length > 0
    ) {
      created = true;
      id = (response as any).result[0]?.id;
    }

    return {
      created: !!created,
      id,
    };
  }

  /**
   * Update an existing issue
   * @param clubId - The club ID
   * @param towerId - The tower ID
   * @param issueId - The issue ID to update
   * @param data - Partial issue data to update
   * @param token - Authentication token
   * @returns Object with updated flag
   */
  async updateIssue(
    clubId: number,
    towerId: number,
    issueId: number,
    data: Partial<Omit<Issue, "id" | "tower_id" | "created_at" | "updated_at">>,
    token: string
  ): Promise<{ updated: boolean }> {
    const response = await this.fetch<Issue>(
      `/clubs/${clubId}/towers/${towerId}/issues/${issueId}`,
      {
        method: "PUT",
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }
    );

    // Handle different response formats
    let updated = false;

    if (response.updated) {
      updated = true;
    } else if (
      (response as any).issue?.data &&
      Array.isArray((response as any).issue.data)
    ) {
      updated = (response as any).issue.data.length > 0;
    } else if (
      (response as any).issue &&
      !Array.isArray((response as any).issue)
    ) {
      updated = true;
    }

    return {
      updated: !!updated,
    };
  }

  /**
   * Delete an issue
   * @param clubId - The club ID
   * @param towerId - The tower ID
   * @param issueId - The issue ID to delete
   * @param token - Authentication token
   * @returns Object with deleted flag
   */
  async deleteIssue(
    clubId: number,
    towerId: number,
    issueId: number,
    token: string
  ): Promise<{ deleted: boolean }> {
    const response = await this.fetch<Issue>(
      `/clubs/${clubId}/towers/${towerId}/issues/${issueId}`,
      {
        method: "DELETE",
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );

    // Handle different response formats
    let deleted = false;

    if (response.deleted) {
      deleted = true;
    } else if (
      (response as any).issue?.data &&
      Array.isArray((response as any).issue.data)
    ) {
      deleted = (response as any).issue.data.length > 0;
    } else if (
      (response as any).issue &&
      !Array.isArray((response as any).issue)
    ) {
      deleted = true;
    }

    return {
      deleted: !!deleted,
    };
  }

  /**
   * Fetch all issues across all clubs and towers
   * Note: This is a convenience method that fetches all clubs and their towers' issues
   * @param token - Authentication token (required for nested API calls)
   * @returns Array of all issues with their tower and club information
   */
  /**
   * Fetch all issues for a specific club (across all towers)
   * @param clubId - The club ID
   * @param token - Authentication token
   * @returns Array of issues with tower names
   */
  async getIssuesByClubId(
    clubId: number,
    token: string
  ): Promise<(Issue & { towerName?: string })[]> {
    try {
      const towers = await this.getTowersByClubId(clubId, token);
      const allIssues: (Issue & { towerName?: string })[] = [];

      for (const tower of towers) {
        const issues = await this.getIssuesByTowerId(clubId, tower.id, token);
        allIssues.push(
          ...issues.map((issue) => ({
            ...issue,
            towerName: tower.name,
          }))
        );
      }

      return allIssues;
    } catch (error) {
      console.error("Error fetching club issues:", error);
      return [];
    }
  }

  async getAllIssues(
    token: string
  ): Promise<
    (Issue & { clubId?: number; clubName?: string; towerName?: string })[]
  > {
    try {
      // Fetch all clubs
      const clubs = await this.getClubs(token);
      const allIssues: (Issue & {
        clubId?: number;
        clubName?: string;
        towerName?: string;
      })[] = [];

      // For each club, fetch towers and then their issues
      for (const club of clubs) {
        const towers = await this.getTowersByClubId(club.id, token);
        for (const tower of towers) {
          const issues = await this.getIssuesByTowerId(
            club.id,
            tower.id,
            token
          );
          // Enrich issues with club and tower info
          allIssues.push(
            ...issues.map((issue) => ({
              ...issue,
              clubId: club.id,
              clubName: club.name,
              towerName: tower.name,
            }))
          );
        }
      }

      return allIssues;
    } catch (error) {
      console.error("Error fetching all issues:", error);
      return [];
    }
  }

  // Scheduled Sessions API
  async getScheduledSessionsByClubId(
    clubId: number,
    token: string
  ): Promise<ScheduledSession[]> {
    const response = await this.fetch<ScheduledSession>(
      `/clubs/${clubId}/scheduled-sessions`,
      {
        method: "GET",
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );

    return response.result || [];
  }

  async getScheduledSessionById(
    clubId: number,
    sessionId: number,
    token: string
  ): Promise<ScheduledSession | null> {
    const response = await this.fetch<ScheduledSession>(
      `/clubs/${clubId}/scheduled-sessions/${sessionId}`,
      {
        method: "GET",
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.result && response.result.length > 0) {
      return response.result[0];
    }
    return null;
  }

  async createScheduledSession(
    clubId: number,
    data: Omit<ScheduledSession, "id">,
    token: string
  ): Promise<{ created: boolean; id?: number; session?: ScheduledSession }> {
    const response = await this.fetch<ScheduledSession>(
      `/clubs/${clubId}/scheduled-sessions`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          schedule: data.schedule,
          description: data.description,
        }),
      }
    );

    return {
      created: response.created || false,
      id: response.id,
      session: response.result?.[0],
    };
  }

  async updateScheduledSession(
    clubId: number,
    sessionId: number,
    data: Partial<Omit<ScheduledSession, "id" | "club_id">>,
    token: string
  ): Promise<{ updated: boolean; session?: ScheduledSession }> {
    const response = await this.fetch<ScheduledSession>(
      `/clubs/${clubId}/scheduled-sessions/${sessionId}`,
      {
        method: "PUT",
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }
    );

    return {
      updated: response.updated || false,
      session: response.result?.[0],
    };
  }

  async deleteScheduledSession(
    clubId: number,
    sessionId: number,
    token: string
  ): Promise<{ deleted: boolean }> {
    const response = await this.fetch<ScheduledSession>(
      `/clubs/${clubId}/scheduled-sessions/${sessionId}`,
      {
        method: "DELETE",
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );

    return {
      deleted: response.deleted || false,
    };
  }

  async getNoticesByClubId(clubId: number, token?: string): Promise<Notice[]> {
    const response = await this.fetch<Notice>(`/clubs/${clubId}/notices`, {
      method: "GET",
      headers: token
        ? {
            authorization: `Bearer ${token}`,
          }
        : {},
    });

    return response.result || [];
  }

  async createNotice(
    clubId: number,
    data: Omit<Notice, "id" | "club_id" | "created_at" | "updated_at">,
    token: string
  ): Promise<{ created: boolean; id?: number; notice?: Notice }> {
    const response = await this.fetch<Notice>(`/clubs/${clubId}/notices`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    return {
      created: response.created || false,
      id: response.id,
      notice: response.result?.[0],
    };
  }

  async updateNotice(
    clubId: number,
    noticeId: number,
    data: Partial<Omit<Notice, "id" | "club_id" | "created_at" | "updated_at">>,
    token: string
  ): Promise<{ updated: boolean; notice?: Notice }> {
    // Backend should automatically update the updated_at timestamp when a notice is modified
    const response = await this.fetch<Notice>(
      `/clubs/${clubId}/notices/${noticeId}`,
      {
        method: "PUT",
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }
    );

    return {
      updated: response.updated || false,
      notice: response.result?.[0],
    };
  }

  async deleteNotice(
    clubId: number,
    noticeId: number,
    token: string
  ): Promise<{ deleted: boolean }> {
    const response = await this.fetch<Notice>(
      `/clubs/${clubId}/notices/${noticeId}`,
      {
        method: "DELETE",
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );

    return {
      deleted: response.deleted || false,
    };
  }
}

export const apiClient = new ApiClient();
