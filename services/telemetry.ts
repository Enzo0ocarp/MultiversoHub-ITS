import { TelemetryEvent } from '../context/types';
import { loadTelemetry, saveToTelemetry } from './storage';

class TelemetryService {
  private events: TelemetryEvent[] = [];
  private maxEvents = 1000;
  
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
      if (this.events.length > this.maxEvents) {
        this.events = this.events.slice(-this.maxEvents);
      }
      
      await saveToTelemetry(this.events);
    } catch (error) {
      console.error('Error saving telemetry events:', error);
    }
  }

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
    
    console.log(`📊 [TELEMETRY] ${type}:`, details);
    
    this.saveEvents();
  }

  getEventsByType(type: TelemetryEvent['type']): TelemetryEvent[] {
    return this.events.filter(event => event.type === type);
  }

  getEventsInRange(startDate: Date, endDate: Date): TelemetryEvent[] {
    return this.events.filter(event => {
      const eventDate = new Date(event.timestamp);
      return eventDate >= startDate && eventDate <= endDate;
    });
  }

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

  async clearAllEvents(): Promise<void> {
    this.events = [];
    await this.saveEvents();
    console.log('All telemetry events cleared');
  }

  // Exportar eventos sin usar Buffer (compatible con React Native)
  exportEvents(): string {
    try {
      return JSON.stringify(this.events, null, 2);
    } catch (error) {
      console.error('Error exporting telemetry:', error);
      return JSON.stringify({ error: 'Unable to export events' });
    }
  }

  getRecentEvents(count: number = 10): TelemetryEvent[] {
    return this.events.slice(-count);
  }
}

const telemetryService = new TelemetryService();

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

export const TelemetryEvents = {
  APP_LAUNCHED: () => logEvent('app_launched', { timestamp: Date.now() }),
  CHARACTER_VIEWED: (characterId: number, characterName: string) => 
    logEvent('character_viewed', { characterId, characterName }),
  FAVORITE_ADDED: (characterId: number, characterName: string) => 
    logEvent('favorite_added', { characterId, characterName }),
  FAVORITE_REMOVED: (characterId: number) => 
    logEvent('favorite_removed', { characterId }),
  FILTER_APPLIED: (filterType: string, filterValue: string) => 
    logEvent('filter_applied', { filterType, filterValue }),
} as const;

export { telemetryService };
