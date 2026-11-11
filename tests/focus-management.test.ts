import test from "node:test";
import assert from "node:assert/strict";
import { activateModal, focusWrapTarget, getTabbableElements, trapTabKey } from "../lib/focusManagement";

// A controlled document model tests lease/cycling logic, not browser rendering
// or native screen-reader behavior. Those remain separate Chrome acceptance.
class ElementModel {
  parentElement: ElementModel | null = null;
  children: ElementModel[] = [];
  inert = false;
  hidden = false;
  disabled = false;
  visible = true;
  visibility = "visible";
  style = {overflow: ""};
  tabIndex = -1;
  name = "";
  type = "";
  checked = false;
  form = null;
  constructor(public ownerDocument: any, public tagName = "DIV") {
    if (["BUTTON", "TEXTAREA", "INPUT", "SELECT", "SUMMARY", "A"].includes(tagName)) this.tabIndex = 0;
  }
  add(child: ElementModel) { child.parentElement = this; this.children.push(child); return child; }
  contains(other: any): boolean { return other === this || this.children.some(child => child.contains(other)); }
  querySelectorAll(): ElementModel[] { return this.children.flatMap(child => [child, ...child.querySelectorAll()]); }
  matches(selector: string) { assert.equal(selector, ":disabled"); return this.disabled || (this.parentElement?.tagName === "FIELDSET" && this.parentElement.disabled); }
  closest(selector: string): ElementModel | null {
    assert.equal(selector, "[inert], [hidden]");
    return this.inert || this.hidden ? this : this.parentElement?.closest(selector) || null;
  }
  getClientRects() { return this.visible ? [{}] : []; }
  focus() { this.ownerDocument.activeElement = this; }
}
function documentModel() {
  const doc: any = {activeElement: null, defaultView: {getComputedStyle: (element: ElementModel) => ({visibility: element.visibility})}};
  const body = new ElementModel(doc, "BODY"); doc.body = body;
  return {doc, body, node: (tag = "DIV") => new ElementModel(doc, tag)};
}
const html = (element: ElementModel) => element as unknown as HTMLElement;

test("modal isolation follows ancestor siblings and preserves existing inert state", () => {
  const {body, node} = documentModel();
  const alreadyHidden = body.add(node()); alreadyHidden.inert = true;
  const workspace = body.add(node());
  const content = workspace.add(node());
  const overlay = workspace.add(node());
  const dialog = overlay.add(node());
  const close = dialog.add(node("BUTTON"));
  const lease = activateModal(html(dialog));
  assert.equal(content.inert, true); assert.equal(alreadyHidden.inert, true);
  assert.equal(workspace.inert, false); assert.equal(overlay.inert, false); assert.equal(close.inert, false);
  assert.equal(body.style.overflow, "hidden");
  lease.release();
  assert.equal(content.inert, false); assert.equal(alreadyHidden.inert, true);
  assert.equal(body.style.overflow, "");
});

test("closing overlapping portals out of order cannot unlock the active modal or leave scroll locked", () => {
  const {body, node} = documentModel();
  body.style.overflow = "clip";
  const workspace = body.add(node());
  const first = body.add(node());
  const outer = activateModal(html(first));
  const second = body.add(node());
  const inner = activateModal(html(second));
  assert.equal(outer.isCurrent(), false); assert.equal(inner.isCurrent(), true);
  assert.equal(workspace.inert, true); assert.equal(first.inert, true); assert.equal(second.inert, false);
  outer.release(); outer.release();
  assert.equal(workspace.inert, true); assert.equal(body.style.overflow, "hidden");
  inner.release(); inner.release();
  assert.equal(workspace.inert, false); assert.equal(first.inert, false);
  assert.equal(body.style.overflow, "clip");
});

test("a nested modal returns keyboard ownership to its still-open parent", () => {
  const {body, node} = documentModel();
  const outerRoot = body.add(node()), outerControl = outerRoot.add(node("BUTTON"));
  const outer = activateModal(html(outerRoot));
  const innerRoot = outerRoot.add(node());
  const inner = activateModal(html(innerRoot));
  assert.equal(outerControl.inert, true); assert.equal(outer.isCurrent(), false);
  inner.release();
  assert.equal(outer.isCurrent(), true); assert.equal(outerControl.inert, false);
  assert.equal(body.style.overflow, "hidden");
  outer.release(); assert.equal(body.style.overflow, "");
});

test("a drawer can retain its dedicated pointer-dismiss backdrop without exposing the workspace", () => {
  const {body, node} = documentModel();
  const workspace = body.add(node()), backdrop = body.add(node("BUTTON")), drawer = body.add(node());
  backdrop.tabIndex = -1;
  const modal = activateModal(html(drawer), html(backdrop));
  assert.equal(workspace.inert, true); assert.equal(backdrop.inert, false);
  assert.deepEqual(getTabbableElements(html(drawer)), []);
  modal.release(); assert.equal(workspace.inert, false);
});

test("tab candidates retain textareas and summaries while excluding disabled, hidden, inert and negative-index controls", () => {
  const {body, node} = documentModel();
  const root = body.add(node());
  const close = root.add(node("BUTTON")), textarea = root.add(node("TEXTAREA")), summary = root.add(node("SUMMARY"));
  const disabled = root.add(node("BUTTON")); disabled.disabled = true;
  const hidden = root.add(node("BUTTON")); hidden.visible = false;
  const negative = root.add(node("BUTTON")); negative.tabIndex = -1;
  const visibility = root.add(node("BUTTON")); visibility.visibility = "hidden";
  const fieldset = root.add(node("FIELDSET")); fieldset.disabled = true; fieldset.add(node("INPUT"));
  const inert = root.add(node()); inert.inert = true; inert.add(node("BUTTON"));
  assert.deepEqual(getTabbableElements(html(root)), [close, textarea, summary]);
});

test("native radio groups have one tab stop and positive indices retain tab order", () => {
  const {body, node} = documentModel(); const root = body.add(node());
  const radio = (name: string, checked = false) => { const control = root.add(node("INPUT")); control.type = "radio"; control.name = name; control.checked = checked; return control; };
  const a = radio("a"), selected = radio("a", true), c = radio("a");
  const firstUnselected = radio("b"), other = radio("b");
  const zero = root.add(node("BUTTON")), positive = root.add(node("BUTTON")); positive.tabIndex = 2;
  assert.deepEqual(getTabbableElements(html(root)), [positive, selected, firstUnselected, zero]);
  assert.ok(!getTabbableElements(html(root)).some(element => [a, c, other].includes(element as unknown as ElementModel)));
});

test("Tab wraps at both boundaries, recovers outside focus, and leaves interior movement native", () => {
  const {body, node} = documentModel(); const root = body.add(node());
  const first = root.add(node("BUTTON")), middle = root.add(node("TEXTAREA")), last = root.add(node("BUTTON"));
  const elements = [first, middle, last].map(html);
  assert.equal(focusWrapTarget(html(root), elements, html(last), false), first);
  assert.equal(focusWrapTarget(html(root), elements, html(first), true), last);
  assert.equal(focusWrapTarget(html(root), elements, html(root), true), last);
  assert.equal(focusWrapTarget(html(root), elements, html(body), false), first);
  assert.equal(focusWrapTarget(html(root), elements, html(middle), false), null);
  assert.equal(focusWrapTarget(html(root), [], null, false), root);
});

test("Tab interception changes focus only when wrapping is required", () => {
  const {doc, body, node} = documentModel(); const root = body.add(node());
  const first = root.add(node("BUTTON")), last = root.add(node("TEXTAREA")); last.focus();
  let prevented = 0;
  trapTabKey({key: "Tab", shiftKey: false, preventDefault: () => prevented++} as unknown as KeyboardEvent, html(root));
  assert.equal(prevented, 1); assert.equal(doc.activeElement, first);
  trapTabKey({key: "ArrowRight", shiftKey: false, preventDefault: () => prevented++} as unknown as KeyboardEvent, html(root));
  assert.equal(prevented, 1); assert.equal(doc.activeElement, first);
});
