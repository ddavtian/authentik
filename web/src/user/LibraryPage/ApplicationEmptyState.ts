import { customElement, state } from "lit/decorators.js";
import { html, css } from "lit";
import { t } from "@lingui/macro";
import { AKElement } from "@goauthentik/elements/Base";
import { SessionUser } from "@goauthentik/api";
import { me } from "@goauthentik/common/users";
import { paramURL } from "@goauthentik/elements/router/RouterOutlet";

import PFContent from "@patternfly/patternfly/components/Content/content.css";
import PFEmptyState from "@patternfly/patternfly/components/EmptyState/empty-state.css";
import PFSpacing from "@patternfly/patternfly/utilities/Spacing/spacing.css";
import PFBase from "@patternfly/patternfly/patternfly-base.css";

/**
 * Library Page Application List Empty
 *
 * Display a message if there are no applications defined in the current instance. If the user is an
 * administrator, provide a link to the "Create a new application" page.
 */

@customElement("ak-library-application-empty-list")
export class LibraryPageApplicationEmptyList extends AKElement {
    static styles = [
        PFBase,
        PFEmptyState,
        PFContent,
        PFSpacing,
        css`
            .cta {
                display: inline-block;
                font-weight: bold;
                color: black;
                border: 3px solid var(--pf-c-empty-state__icon--Color);
                padding: var(--pf-global--spacer--sm);
            }
        `,
    ];

    @state() isSuperUser: boolean = false;

    connectedCallback() {
        super.connectedCallback();
        me().then((me: SessionUser) => {
            this.isSuperUser = me.user.isSuperuser;
        });
    }

    renderNewAppButton() {
        const href = paramURL("/core/applications", {
            createForm: true,
        });
        return html`
            <div class="pf-u-pt-lg">
                <a aria-disabled="false" class="cta pf-m-secondary" href="/if/admin/${href}"
                    >${t`Define a new application`}</a
                >
            </div>
            <div class="pf-c-empty-state__body">
                <a href="https://goauthentik.io/docs/applications"
                    >${t`Read the documentation on how to define new applications.`}</a
                >
            </div>
        `;
    }

    render() {
        return html` <div class="pf-c-empty-state pf-m-full-height">
            <div class="pf-c-empty-state__content">
                <i class="fas fa-cubes pf-c-empty-state__icon" aria-hidden="true"></i>
                <h1 class="pf-c-title pf-m-lg">${t`No Applications available.`}</h1>
                <div class="pf-c-empty-state__body">
                    ${t`Either no applications are defined, or you don’t have access to any.`}
                </div>
                ${this.isSuperUser ? this.renderNewAppButton() : html``}
            </div>
        </div>`;
    }
}
