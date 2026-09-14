/**
 * Utilitaires pour la manipulation pure et sécurisée de l'API DOM
 */

export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | boolean | number> = {},
  children: (HTMLElement | string)[] = []
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className' || key === 'class') {
      el.className = String(value);
    } else if (key.startsWith('data-')) {
      el.setAttribute(key, String(value));
    } else if (typeof value === 'boolean') {
      if (value) el.setAttribute(key, '');
    } else {
      el.setAttribute(key, String(value));
    }
  }

  for (const child of children) {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else if (typeof child === 'object' && child !== null && 'nodeType' in child) {
      el.appendChild(child);
    }
  }

  return el;
}

/**
 * Nettoie le contenu d'un élément DOM
 */
export function emptyElement(el: HTMLElement): void {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

/**
 * Délégation d'événements DOM sécurisée
 */
export function delegateEvent(
  parent: HTMLElement | Document,
  eventType: string,
  selector: string,
  handler: (event: Event, target: HTMLElement) => void
): () => void {
  const listener = (event: Event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const matchedEl = target.closest(selector) as HTMLElement | null;
    if (matchedEl && parent.contains(matchedEl)) {
      handler(event, matchedEl);
    }
  };

  parent.addEventListener(eventType, listener);
  return () => parent.removeEventListener(eventType, listener);
}

/**
 * Échappement HTML contre les injections XSS
 */
export function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Formateur de nombres (milliers avec espaces)
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('fr-FR').format(num);
}
