import { createElement } from '../utils/dom';

export type ToastType = 'success' | 'error' | 'info';

export class Toast {
  private static container: HTMLElement | null = null;

  private static getContainer(): HTMLElement {
    if (!this.container || !document.body.contains(this.container)) {
      this.container = createElement('div', { class: 'toast-container', 'aria-live': 'polite' });
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  public static show(message: string, type: ToastType = 'info', duration: number = 3500): void {
    const container = this.getContainer();

    const icons: Record<ToastType, string> = {
      success: '✓',
      error: '✕',
      info: 'ℹ'
    };

    const toast = createElement('div', { class: `toast toast-${type}` }, [
      createElement('span', { style: 'font-weight: 800; font-size: 1.1rem;' }, [icons[type]]),
      createElement('span', { style: 'flex: 1;' }, [message])
    ]);

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => {
        toast.remove();
      }, 250);
    }, duration);
  }
}
