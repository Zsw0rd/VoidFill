/** Shared modal leases keep nested/overlapping dialogs from unlocking each other. */
const inertOwners = new WeakMap<HTMLElement, { count: number; previous: boolean }>();
const scrollOwners = new WeakMap<HTMLElement, { count: number; previous: string }>();
const modalStacks = new WeakMap<Document, { root: HTMLElement }[]>();

export const TABBABLE_SELECTOR = 'a[href], area[href], button, input:not([type="hidden"]), select, textarea, summary, audio[controls], video[controls], iframe, [contenteditable="true"], [tabindex]';

export function getTabbableElements(root: HTMLElement): HTMLElement[] {
  const elements = Array.from(root.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR)).filter(element =>
    element.tabIndex >= 0 && !element.matches(":disabled") && !element.closest("[inert], [hidden]") &&
    element.getClientRects().length > 0 && element.ownerDocument.defaultView?.getComputedStyle(element).visibility !== "hidden",
  );
  const radioGroups = elements.filter((element): element is HTMLInputElement => element.tagName === "INPUT" && (element as HTMLInputElement).type === "radio" && !!(element as HTMLInputElement).name);
  return elements.filter(element => {
    if (!radioGroups.includes(element as HTMLInputElement)) return true;
    const radio = element as HTMLInputElement;
    const group = radioGroups.filter(other => other.name === radio.name && other.form === radio.form);
    return radio === (group.find(other => other.checked) || group[0]);
  }).sort((a, b) => {
    const left = a.tabIndex > 0 ? a.tabIndex : Infinity, right = b.tabIndex > 0 ? b.tabIndex : Infinity;
    return left === right ? 0 : left - right;
  });
}

export function focusWrapTarget(root: HTMLElement, elements: HTMLElement[], active: Element | null, backwards: boolean): HTMLElement | null {
  if (!elements.length) return root;
  const first = elements[0], last = elements[elements.length - 1];
  const outside = !active || !root.contains(active);
  if (backwards && (outside || active === root || active === first)) return last;
  if (!backwards && (outside || active === root || active === last)) return first;
  return null;
}

export function trapTabKey(event: KeyboardEvent, root: HTMLElement | null) {
  if (event.key !== "Tab" || !root || event.defaultPrevented) return;
  const target = focusWrapTarget(root, getTabbableElements(root), root.ownerDocument.activeElement, event.shiftKey);
  if (!target) return;
  event.preventDefault();
  target.focus();
}

export function activateModal(root: HTMLElement, outsideDismiss: HTMLElement | null = null) {
  const document = root.ownerDocument, body = document.body;
  const stack = modalStacks.get(document) || [];
  const token = { root };
  stack.push(token);
  modalStacks.set(document, stack);
  const targets: HTMLElement[] = [];
  let branch: Element = root;
  for (let parent = branch.parentElement; parent; parent = branch.parentElement) {
    for (const sibling of Array.from(parent.children)) {
      // A dedicated, non-tabbable backdrop may dismiss a drawer by pointer.
      if (sibling === branch || sibling === outsideDismiss || !("inert" in sibling) || /^(SCRIPT|STYLE|LINK|META)$/.test(sibling.tagName)) continue;
      const target = sibling as HTMLElement;
      const lease = inertOwners.get(target) || { count: 0, previous: target.inert };
      lease.count++;
      inertOwners.set(target, lease);
      target.inert = true;
      targets.push(target);
    }
    if (parent === body) break;
    branch = parent;
  }
  const scroll = scrollOwners.get(body) || { count: 0, previous: body.style.overflow };
  scroll.count++;
  scrollOwners.set(body, scroll);
  body.style.overflow = "hidden";
  let released = false;
  return {
    isCurrent: () => !released && stack[stack.length - 1] === token,
    release() {
      if (released) return;
      released = true;
      const index = stack.indexOf(token);
      if (index !== -1) stack.splice(index, 1);
      if (!stack.length) modalStacks.delete(document);
      for (const target of targets) {
        const lease = inertOwners.get(target);
        if (!lease || --lease.count > 0) continue;
        target.inert = lease.previous;
        inertOwners.delete(target);
      }
      const lease = scrollOwners.get(body);
      if (lease && --lease.count === 0) {
        body.style.overflow = lease.previous;
        scrollOwners.delete(body);
      }
    },
  };
}
