export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface AlertConfig {
  title: string;
  message?: string;
  type?: AlertType;
  buttons?: AlertButton[];
}

type AlertListener = (config: AlertConfig | null) => void;

let currentAlert: AlertConfig | null = null;
const listeners: Set<AlertListener> = new Set();

export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
  type?: AlertType
): void;
export function showAlert(config: AlertConfig): void;
export function showAlert(
  titleOrConfig: string | AlertConfig,
  message?: string,
  buttons?: AlertButton[],
  type?: AlertType
) {
  if (typeof titleOrConfig === 'string') {
    let autoType: AlertType = type || 'info';
    if (!type) {
      const lower = titleOrConfig.toLowerCase();
      if (
        lower.includes('sukses') ||
        lower.includes('berhasil') ||
        lower.includes('🎉') ||
        lower.includes('✅') ||
        lower.includes('🟢')
      ) {
        autoType = 'success';
      } else if (
        lower.includes('gagal') ||
        lower.includes('salah') ||
        lower.includes('terhapus') ||
        lower.includes('🔴')
      ) {
        autoType = 'error';
      } else if (
        lower.includes('perhatian') ||
        lower.includes('batas') ||
        lower.includes('habis') ||
        lower.includes('⚠️') ||
        lower.includes('🚫')
      ) {
        autoType = 'warning';
      } else if (buttons && buttons.length > 1) {
        autoType = 'confirm';
      }
    }

    currentAlert = {
      title: titleOrConfig,
      message,
      buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'OK', style: 'default' }],
      type: autoType,
    };
  } else {
    currentAlert = {
      ...titleOrConfig,
      buttons:
        titleOrConfig.buttons && titleOrConfig.buttons.length > 0
          ? titleOrConfig.buttons
          : [{ text: 'OK', style: 'default' }],
    };
  }

  listeners.forEach((listener) => listener(currentAlert));
}

export function hideAlert() {
  currentAlert = null;
  listeners.forEach((listener) => listener(null));
}

export function subscribeAlert(listener: AlertListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getAlertConfig() {
  return currentAlert;
}
