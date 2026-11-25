// =====================================================================
// TradeMind AI - Expo Push Notifications & Alert Dispatcher Service
// Handles permission requests, Android notification channels, push token
// registration, preference filtering, and notification tap routing.
// =====================================================================

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  NotificationPayload,
  NotificationPreferences,
  AlertEvent,
} from '../../types/alert';
import { AIAnalysisResult } from '../../types/analysis';

// 1. Configure default foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  private preferences: NotificationPreferences = {
    breakoutAlerts: true,
    aiAnalysisAlerts: true,
    priceAlerts: true,
    riskAlerts: true,
    soundEnabled: true,
    expoPushToken: null,
    permissionStatus: 'undetermined',
  };

  private isInitialized = false;

  constructor() {
    this.initChannels();
  }

  /**
   * Initializes Android high-priority notification channels
   */
  public async initChannels(): Promise<void> {
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('trade_alerts', {
          name: 'TradeMind Market Alerts',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#38BDF8',
          enableLights: true,
          enableVibrate: true,
        });

        await Notifications.setNotificationChannelAsync('ai_analysis', {
          name: 'TradeMind AI Analysis',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 200, 200, 200],
          lightColor: '#00E676',
          enableLights: true,
        });

        await Notifications.setNotificationChannelAsync('risk_warnings', {
          name: 'TradeMind Risk Warnings',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 500, 250, 500],
          lightColor: '#FF5252',
          enableLights: true,
          enableVibrate: true,
        });

        this.isInitialized = true;
      } catch (err) {
        console.warn('[NotificationService] Android channels setup notice:', err);
      }
    }
  }

  /**
   * Requests system notification permission from the user
   */
  public async requestPermissions(): Promise<{ granted: boolean; status: string }> {
    try {
      const settings = await Notifications.getPermissionsAsync();
      let status = settings.status;

      if (status !== 'granted') {
        const request = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        status = request.status;
      }

      const granted = status === 'granted';
      this.preferences.permissionStatus = granted ? 'granted' : 'denied';

      return { granted, status };
    } catch (err: any) {
      console.warn('[NotificationService] Permission request failed:', err);
      this.preferences.permissionStatus = 'denied';
      return { granted: false, status: 'error' };
    }
  }

  /**
   * Registers and retrieves Expo device push token for server-side push alerts
   */
  public async registerForPushNotifications(): Promise<string | null> {
    const { granted } = await this.requestPermissions();
    if (!granted) {
      this.preferences.expoPushToken = null;
      return null;
    }

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData.data;
      this.preferences.expoPushToken = token;
      return token;
    } catch (err) {
      // In simulator, bare emulator, or offline environments, use local token
      const fallbackToken = `LOCAL_DEVICE_MOCK_TOKEN_${Date.now()}`;
      this.preferences.expoPushToken = fallbackToken;
      return fallbackToken;
    }
  }

  /**
   * Returns current user notification preferences
   */
  public getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  /**
   * Updates notification preferences
   */
  public updatePreferences(updates: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...updates };
  }

  /**
   * Sends a local notification if preferences permit
   */
  public async sendNotification(payload: NotificationPayload): Promise<string | null> {
    const channelId = payload.channelId || 'trade_alerts';

    // Verify user preferences
    if (channelId === 'ai_analysis' && !this.preferences.aiAnalysisAlerts) {
      return null;
    }
    if (channelId === 'trade_alerts' && !this.preferences.priceAlerts && !this.preferences.breakoutAlerts) {
      return null;
    }
    if (channelId === 'risk_warnings' && !this.preferences.riskAlerts) {
      return null;
    }

    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: payload.title,
          body: payload.body,
          data: payload.data || {},
          sound: this.preferences.soundEnabled ? 'default' : undefined,
        },
        trigger: null, // Immediate delivery
      });

      return identifier;
    } catch (err) {
      console.warn('[NotificationService] Local notification dispatch error:', err);
      return null;
    }
  }

  /**
   * Dispatches high-priority notification when an AI analysis completes
   */
  public async notifyAIAnalysisComplete(analysis: AIAnalysisResult): Promise<string | null> {
    const isActionable = analysis.decision === 'LONG' || analysis.decision === 'SHORT';
    const title = isActionable
      ? `TradeMind AI: Confirmed ${analysis.decision} Setup (${analysis.technicalScore}/10)`
      : `TradeMind AI: ${analysis.decision} on ${analysis.instrumentSymbol}`;

    let body = `${analysis.instrumentSymbol} scored ${analysis.technicalScore}/10.`;
    if (isActionable && analysis.levels) {
      body += ` Entry: ${analysis.levels.entryPrice.toLocaleString()} | SL: ${analysis.levels.stopLossPrice.toLocaleString()} | TP1: ${analysis.levels.takeProfit1.toLocaleString()} (R:R ${analysis.levels.riskRewardTP1}x)`;
    } else {
      body += ` Setup condition: ${analysis.marketCondition}. Technical alignment does not support entry.`;
    }

    return this.sendNotification({
      title,
      body,
      channelId: 'ai_analysis',
      data: {
        screen: 'AI Analysis',
        symbol: analysis.instrumentSymbol,
        analysisId: analysis.id,
      },
    });
  }

  /**
   * Dispatches market alert event notification
   */
  public async notifyAlertEvent(event: AlertEvent): Promise<string | null> {
    return this.sendNotification({
      title: event.headline,
      body: event.message,
      channelId: event.alertType === 'RISK_VIOLATION' ? 'risk_warnings' : 'trade_alerts',
      data: {
        screen: 'AI Analysis',
        symbol: event.symbol,
        alertId: event.id,
        marketType: event.marketType,
      },
    });
  }

  /**
   * Registers global response listener for notification taps
   */
  public addNotificationTapListener(onTap: (data: any) => void): () => void {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data && onTap) {
        onTap(data);
      }
    });

    return () => {
      subscription.remove();
    };
  }
}

export const notificationService = new NotificationService();
