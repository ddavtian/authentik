import { html } from "lit";
import { t } from "@lingui/macro";
import type { TemplateResult } from "lit";
import "@goauthentik/elements/EmptyState";

export const customEvent = (name: string, details = {}) =>
    new CustomEvent(name, {
        composed: true,
        bubbles: true,
        detail: details,
    });

export const isCustomEvent = (v: any): v is CustomEvent => v instanceof CustomEvent && "detail" in v;

export const loading = <T>(v: T, actual: TemplateResult) =>
    v ? actual : html`<ak-empty-state ?loading="${true}" header=${t`Loading`}> </ak-empty-state>`;
