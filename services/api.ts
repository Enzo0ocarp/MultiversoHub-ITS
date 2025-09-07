import { ApiResponse, Character, CharacterStatus, Episode } from '../context/types';

const BASE_URL = 'https://rickandmortyapi.com/api';

class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export class RickAndMortyAPI {
  private async fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('Request timeout');
      }
      throw error;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorMessage = `HTTP error! status: ${response.status}`;
      throw new ApiError(errorMessage, response.status);
    }
    
    try {
      return await response.json();
    } catch (error) {
      throw new ApiError('Invalid JSON response');
    }
  }

  // Obtener todos los personajes con paginación
  async getCharacters(page: number = 1): Promise<ApiResponse<Character>> {
    try {
      const response = await this.fetchWithTimeout(`${BASE_URL}/character?page=${page}`);
      return this.handleResponse<ApiResponse<Character>>(response);
    } catch (error) {
      console.error('Error fetching characters:', error);
      throw error;
    }
  }

  // Obtener personajes con filtro de estado
  async getCharactersByStatus(status: CharacterStatus, page: number = 1): Promise<ApiResponse<Character>> {
    try {
      const statusParam = status === 'all' ? '' : `&status=${status}`;
      const response = await this.fetchWithTimeout(`${BASE_URL}/character?page=${page}${statusParam}`);
      return this.handleResponse<ApiResponse<Character>>(response);
    } catch (error) {
      console.error('Error fetching characters by status:', error);
      throw error;
    }
  }

  // Obtener un personaje por ID
  async getCharacter(id: number): Promise<Character> {
    try {
      const response = await this.fetchWithTimeout(`${BASE_URL}/character/${id}`);
      return this.handleResponse<Character>(response);
    } catch (error) {
      console.error(`Error fetching character ${id}:`, error);
      throw error;
    }
  }

  // Obtener múltiples personajes por IDs
  async getMultipleCharacters(ids: number[]): Promise<Character[]> {
    if (ids.length === 0) return [];
    
    try {
      const idsString = ids.join(',');
      const response = await this.fetchWithTimeout(`${BASE_URL}/character/${idsString}`);
      const result = await this.handleResponse<Character | Character[]>(response);
      
      // Si es un solo personaje, devolver array
      return Array.isArray(result) ? result : [result];
    } catch (error) {
      console.error('Error fetching multiple characters:', error);
      throw error;
    }
  }

  // Obtener episodio por ID
  async getEpisode(id: number): Promise<Episode> {
    try {
      const response = await this.fetchWithTimeout(`${BASE_URL}/episode/${id}`);
      return this.handleResponse<Episode>(response);
    } catch (error) {
      console.error(`Error fetching episode ${id}:`, error);
      throw error;
    }
  }

  // Obtener múltiples episodios por URLs
  async getEpisodesFromUrls(urls: string[]): Promise<Episode[]> {
    if (urls.length === 0) return [];

    try {
      // Extraer IDs de las URLs
      const ids = urls.map(url => {
        const parts = url.split('/');
        return parseInt(parts[parts.length - 1]);
      }).filter(id => !isNaN(id));

      if (ids.length === 0) return [];

      const idsString = ids.join(',');
      const response = await this.fetchWithTimeout(`${BASE_URL}/episode/${idsString}`);
      const result = await this.handleResponse<Episode | Episode[]>(response);
      
      return Array.isArray(result) ? result : [result];
    } catch (error) {
      console.error('Error fetching episodes from URLs:', error);
      throw error;
    }
  }

  // Buscar personajes por nombre
  async searchCharacters(name: string, page: number = 1): Promise<ApiResponse<Character>> {
    try {
      const response = await this.fetchWithTimeout(`${BASE_URL}/character?name=${encodeURIComponent(name)}&page=${page}`);
      return this.handleResponse<ApiResponse<Character>>(response);
    } catch (error) {
      console.error('Error searching characters:', error);
      throw error;
    }
  }
}

// Instancia singleton del API
export const api = new RickAndMortyAPI();