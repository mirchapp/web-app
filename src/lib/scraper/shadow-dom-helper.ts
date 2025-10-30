/**
 * Shadow DOM Helper Functions
 * Utilities for querying elements inside Shadow DOM roots
 */

/**
 * Query selector that works with Shadow DOM
 * Recursively searches through shadow roots
 */
export function querySelectorDeep(selector: string, root: Document | ShadowRoot | Element = document): Element | null {
  // Try normal querySelector first
  const element = root.querySelector(selector);
  if (element) return element;

  // Search in shadow roots
  const allElements = root.querySelectorAll('*');
  for (const el of allElements) {
    if (el.shadowRoot) {
      const found = querySelectorDeep(selector, el.shadowRoot);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Query all selectors that work with Shadow DOM
 */
export function querySelectorAllDeep(selector: string, root: Document | ShadowRoot | Element = document): Element[] {
  const results: Element[] = [];

  // Get elements from current level
  const elements = Array.from(root.querySelectorAll(selector));
  results.push(...elements);

  // Search in shadow roots
  const allElements = root.querySelectorAll('*');
  for (const el of allElements) {
    if (el.shadowRoot) {
      const found = querySelectorAllDeep(selector, el.shadowRoot);
      results.push(...found);
    }
  }

  return results;
}

/**
 * Get all text content including Shadow DOM
 */
export function getTextContentDeep(root: Document | Element = document): string {
  let text = '';

  function traverse(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent || '';
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      
      // Check shadow root
      if (element.shadowRoot) {
        traverse(element.shadowRoot);
      }
      
      // Traverse children
      for (const child of element.childNodes) {
        traverse(child);
      }
    }
  }

  traverse(root);
  return text;
}

