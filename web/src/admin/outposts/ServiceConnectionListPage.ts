import "@goauthentik/admin/outposts/OutpostHealth";
import "@goauthentik/admin/outposts/ServiceConnectionDockerForm";
import "@goauthentik/admin/outposts/ServiceConnectionKubernetesForm";
import "@goauthentik/admin/outposts/ServiceConnectionWizard";
import { DEFAULT_CONFIG } from "@goauthentik/common/api/config";
import { uiConfig } from "@goauthentik/common/ui/config";
import { PFColor } from "@goauthentik/elements/Label";
import "@goauthentik/elements/buttons/SpinnerButton";
import "@goauthentik/elements/forms/DeleteBulkForm";
import "@goauthentik/elements/forms/ModalForm";
import "@goauthentik/elements/forms/ProxyForm";
import { PaginatedResponse } from "@goauthentik/elements/table/Table";
import { TableColumn } from "@goauthentik/elements/table/Table";
import { TablePage } from "@goauthentik/elements/table/TablePage";

import { t } from "@lingui/macro";

import { TemplateResult, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { until } from "lit/directives/until.js";

import { OutpostsApi, ServiceConnection } from "@goauthentik/api";

@customElement("ak-outpost-service-connection-list")
export class OutpostServiceConnectionListPage extends TablePage<ServiceConnection> {
    pageTitle(): string {
        return "Outpost integrations";
    }
    pageDescription(): string | undefined {
        return "Outpost integrations define how authentik connects to external platforms to manage and deploy Outposts.";
    }
    pageIcon(): string {
        return "pf-icon pf-icon-integration";
    }
    searchEnabled(): boolean {
        return true;
    }

    checkbox = true;

    async apiEndpoint(page: number): Promise<PaginatedResponse<ServiceConnection>> {
        return new OutpostsApi(DEFAULT_CONFIG).outpostsServiceConnectionsAllList({
            ordering: this.order,
            page: page,
            pageSize: (await uiConfig()).pagination.perPage,
            search: this.search || "",
        });
    }

    columns(): TableColumn[] {
        return [
            new TableColumn(t`Name`, "name"),
            new TableColumn(t`Type`),
            new TableColumn(t`Local`, "local"),
            new TableColumn(t`State`),
            new TableColumn(t`Actions`),
        ];
    }

    @property()
    order = "name";

    row(item: ServiceConnection): TemplateResult[] {
        return [
            html`${item.name}`,
            html`${item.verboseName}`,
            html`<ak-label color=${item.local ? PFColor.Grey : PFColor.Green}>
                ${item.local ? t`Yes` : t`No`}
            </ak-label>`,
            html`${until(
                new OutpostsApi(DEFAULT_CONFIG)
                    .outpostsServiceConnectionsAllStateRetrieve({
                        uuid: item.pk || "",
                    })
                    .then((state) => {
                        if (state.healthy) {
                            return html`<ak-label color=${PFColor.Green}
                                >${ifDefined(state.version)}</ak-label
                            >`;
                        }
                        return html`<ak-label color=${PFColor.Red}>${t`Unhealthy`}</ak-label>`;
                    }),
                html`<ak-spinner></ak-spinner>`,
            )}`,
            html` <ak-forms-modal>
                <span slot="submit"> ${t`Update`} </span>
                <span slot="header"> ${t`Update ${item.verboseName}`} </span>
                <ak-proxy-form
                    slot="form"
                    .args=${{
                        instancePk: item.pk,
                    }}
                    type=${ifDefined(item.component)}
                >
                </ak-proxy-form>
                <button slot="trigger" class="pf-c-button pf-m-plain">
                    <i class="fas fa-edit"></i>
                </button>
            </ak-forms-modal>`,
        ];
    }

    renderToolbarSelected(): TemplateResult {
        const disabled = this.selectedElements.length < 1;
        return html`<ak-forms-delete-bulk
            objectLabel=${t`Outpost integration(s)`}
            .objects=${this.selectedElements}
            .usedBy=${(item: ServiceConnection) => {
                return new OutpostsApi(DEFAULT_CONFIG).outpostsServiceConnectionsAllUsedByList({
                    uuid: item.pk,
                });
            }}
            .delete=${(item: ServiceConnection) => {
                return new OutpostsApi(DEFAULT_CONFIG).outpostsServiceConnectionsAllDestroy({
                    uuid: item.pk,
                });
            }}
        >
            <button ?disabled=${disabled} slot="trigger" class="pf-c-button pf-m-danger">
                ${t`Delete`}
            </button>
        </ak-forms-delete-bulk>`;
    }

    renderObjectCreate(): TemplateResult {
        return html`<ak-service-connection-wizard></ak-service-connection-wizard> `;
    }
}