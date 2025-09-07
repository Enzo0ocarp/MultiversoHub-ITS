import { TelemetryEvent } from '../context/types';
import { loadTelemetry, saveToTelemetry } from './storage';

class TelemetryService {
  private events: TelemetryEvent[] = [];
  private maxEvents = 1000; // Máximo número de eventos a mantener
  
  constructor() {
    this.loadStoredEvents();
  }

  private async loadStoredEvents() {
    try {
      this.events = await loadTelemetry();
      console.log(`Loaded ${this.events.length} telemetry events`);
    } catch (error) {
      console.error('Error loading telemetry events:', error);
      this.events = [];
    }
  }

  private async saveEvents() {
    try {
      // Mantener solo los eventos más recientes
      if (this.events.length > this.maxEvents) {
        this.events = this.events.slice(-this.maxEvents);
      }
      
      await saveToTelemetry(this.events);
    } catch (error) {
      console.error('Error saving telemetry events:', error);
    }
  }

  // Registrar un evento
  async logEvent(
    type: TelemetryEvent['type'], 
    details: Record<string, any> = {}
  ): Promise<void> {
    const event: TelemetryEvent = {
      timestamp: new Date().toISOString(),
      type,
      details: {
        ...details,
        deviceTimestamp: Date.now(),
      },
    };

    this.events.push(event);
    
    // Log en consola para debugging
    console.log(`📊 [TELEMETRY] ${type}:`, details);
    
    // Guardar en storage de forma asíncrona
    this.saveEvents();
  }

  // Obtener eventos por tipo
  getEventsByType(type: TelemetryEvent['type']): TelemetryEvent[] {
    return this.events.filter(event => event.type === type);
  }

  // Obtener eventos en un rango de fechas
  getEventsInRange(startDate: Date, endDate: Date): TelemetryEvent[] {
    return this.events.filter(event => {
      const eventDate = new Date(event.timestamp);
      return eventDate >= startDate && eventDate <= endDate;
    });
  }

  // Obtener estadísticas básicas
  getStats(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    mostRecentEvent: TelemetryEvent | null;
    oldestEvent: TelemetryEvent | null;
  } {
    const eventsByType: Record<string, number> = {};
    
    this.events.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    });

    return {
      totalEvents: this.events.length,
      eventsByType,
      mostRecentEvent: this.events.length > 0 ? this.events[this.events.length - 1] : null,
      oldestEvent: this.events.length > 0 ? this.events[0] : null,
    };
  }

  // Limpiar eventos antiguos
  async clearOldEvents(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const initialCount = this.events.length;
    this.events = this.events.filter(event => {
      const eventDate = new Date(event.timestamp);
      return eventDate >= cutoffDate;
    });
    
    await this.saveEvents();
    
    const removedCount = initialCount - this.events.length;
    console.log(`Removed ${removedCount} old telemetry events`);
    
    return removedCount;
  }

  // Limpiar todos los eventos
  async clearAllEvents(): Promise<void> {
    this.events = [];
    await this.saveEvents();
    console.log('All telemetry events cleared');
  }

  // Exportar eventos para debugging
  exportEvents(): string {
    return JSON.stringify(this.events, null, 2);
  }

  // Obtener eventos recientes (útil para debugging)
  getRecentEvents(count: number = 10): TelemetryEvent[] {
    return this.events.slice(-count);
  }
}

// Crear instancia singleton
const telemetryService = new TelemetryService();

// Funciones de conveniencia
export const logEvent = (type: TelemetryEvent['type'], details?: Record<string, any>) => {
  return telemetryService.logEvent(type, details);
};

export const getTelemetryStats = () => {
  return telemetryService.getStats();
};

export const clearTelemetryEvents = () => {
  return telemetryService.clearAllEvents();
};

export const exportTelemetryEvents = () => {
  return telemetryService.exportEvents();
};

export const getRecentTelemetryEvents = (count?: number) => {
  return telemetryService.getRecentEvents(count);
};

// Eventos predefinidos para facilitar el uso
export const TelemetryEvents = {
  // Navegación
  APP_LAUNCHED: () => logEvent('app_launched', { timestamp: Date.now() }),
  
  // Personajes
  CHARACTER_VIEWED: (characterId: number, characterName: string) => 
    logEvent('character_viewed', { characterId, characterName }),
  
  // Favoritos
  FAVORITE_ADDED: (characterId: number, characterName: string) => 
    logEvent('favorite_added', { characterId, characterName }),
  
  FAVORITE_REMOVED: (characterId: number) => 
    logEvent('favorite_removed', { characterId }),
  
  // Filtros
  FILTER_APPLIED: (filterType: string, filterValue: string) => 
    logEvent('filter_applied', { filterType, filterValue }),
} as const;

export { telemetryService };
