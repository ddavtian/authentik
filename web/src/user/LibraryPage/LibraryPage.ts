import { css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { DEFAULT_CONFIG } from "@goauthentik/common/api/config";
import { Application, CoreApi } from "@goauthentik/api";
import { groupBy } from "@goauthentik/common/utils";
import { AKElement, rootInterface } from "@goauthentik/elements/Base";
import { PaginatedResponse } from "@goauthentik/elements/table/Table";
import { t } from "@lingui/macro";
import PFContent from "@patternfly/patternfly/components/Content/content.css";
import PFEmptyState from "@patternfly/patternfly/components/EmptyState/empty-state.css";
import PFPage from "@patternfly/patternfly/components/Page/page.css";
import PFBase from "@patternfly/patternfly/patternfly-base.css";
import PFDisplay from "@patternfly/patternfly/utilities/Display/display.css";
import { isCustomEvent, loading } from "./helpers";

import "@goauthentik/elements/EmptyState";
import "@goauthentik/user/LibraryApplication";
import "./ApplicationEmptyState";
import "./ApplicationSearch";
import "./ApplicationList";

import type { AppGroupList } from "./types";

const isFullUrlRe = new RegExp("://");
const isHttpRe = new RegExp("http(s?)://");
const isNotFullUrl = (url: string) => !isFullUrlRe.test(url);
const isHttp = (url: string) => isHttpRe.test(url);

const appHasLaunchUrl = (app: Application) => {
    const url = app.launchUrl;
    return !!(typeof url === "string" && url !== "" && (isHttp(url) || isNotFullUrl(url)));
};

const filterApps = (apps: Application[]): Application[] => apps.filter(appHasLaunchUrl);

const styles = [PFBase, PFDisplay, PFEmptyState, PFPage, PFContent].concat(css`
    :host,
    main {
        padding: 3% 5%;
    }
    .header {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
    }
    .header input {
        width: 30ch;
        box-sizing: border-box;
        border: 0;
        border-bottom: 1px solid;
        border-bottom-color: #fd4b2d;
        background-color: transparent;
        font-size: 1.5rem;
    }
    .header input:focus {
        outline: 0;
    }
    .pf-c-page__main {
        overflow: hidden;
    }
    .pf-c-page__main-section {
        background-color: transparent;
    }
`);

/**
 * List of Applications available
 *
 * Properties:
 * apps: a list of the applications available to the user.
 *
 * Aggregates two functions:
 *   - Display the list of applications available to the user
 *   - Filter that list using the search bar
 *
 */

@customElement("ak-library")
export class LibraryPage extends AKElement {
    @property({ attribute: false })
    apps?: PaginatedResponse<Application>;

    @state()
    selectedApp?: Application;

    @state()
    filteredApps: Application[] = [];

    static styles = styles;

    constructor() {
        super();
        new CoreApi(DEFAULT_CONFIG).coreApplicationsList({}).then((apps) => {
            this.apps = apps;
            this.filteredApps = apps.results;
        });
        this.searchUpdated = this.searchUpdated.bind(this);
        this.launchRequest = this.launchRequest.bind(this);
    }

    pageTitle(): string {
        return t`My Applications`;
    }

    connectedCallback() {
        super.connectedCallback();
        this.addEventListener("ak-library-search-updated", this.searchUpdated);
        this.addEventListener("ak-library-item-selected", this.launchRequest);
    }

    disconnectedCallback() {
        this.removeEventListener("ak-library-search-updated", this.searchUpdated);
        this.removeEventListener("ak-library-item-selected", this.launchRequest);
        super.disconnectedCallback();
    }

    searchUpdated(event: Event) {
        if (!isCustomEvent(event)) {
            throw new Error("ak-library-search-updated must send a custom event.");
        }
        event.stopPropagation();
        this.selectedApp = event.detail.apps[0];
        this.filteredApps = event.detail.apps;
    }

    launchRequest(event: Event) {
        if (!isCustomEvent(event)) {
            throw new Error("ak-library-item-selected must send a custom event");
        }
        event.stopPropagation();
        const location = this.selectedApp?.launchUrl;
        if (location) {
            window.location.assign(location);
        }
    }

    getApps(): AppGroupList {
        return groupBy(filterApps(this.filteredApps), (app) => app.group || "");
    }

    renderEmptyState() {
        return html`<ak-library-application-empty-list></ak-library-application-empty-list>`;
    }

    renderApps() {
        const uiConfig = rootInterface()?.uiConfig;
        if (!uiConfig) {
            throw new Error("Library page cannot run without rootInterface configuration.");
        }
        const selected = this.selectedApp?.slug;
        const apps = this.getApps();
        const layout = uiConfig.layout.type as string;
        const background = uiConfig.theme.cardBackground;

        return html`<ak-library-application-list
            layout="${layout}"
            background="${background}"
            selected="${selected}"
            .apps=${apps}
        ></ak-library-application-list>`;
    }

    renderSearch() {
        return html`<ak-library-list-search .apps="{this.apps.results}"></ak-library-list-search>`;
    }

    render() {
        const searchEnabled = rootInterface()?.uiConfig?.enabledFeatures.search;

        return html`<main role="main" class="pf-c-page__main" tabindex="-1" id="main-content">
            <div class="pf-c-content header">
                <h1>${t`My applications`}</h1>
                ${searchEnabled ? this.renderSearch() : html``}
            </div>
            <section class="pf-c-page__main-section">
                ${loading(
                    this.apps,
                    html`${filterApps(this.filteredApps).length > 0 ? this.renderApps() : this.renderEmptyState()}`
                )}
            </section>
        </main>`;
    }
}
