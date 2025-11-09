import { ActionFlow } from '../actions/base/action_flow';
import { Variable } from '../data_type/variable';
import { VariableJsonConverter } from '../data_type/variable_json_convertor';
import { JsonLike } from '../utils';
import { as$ } from '../utils/functional_utils';
import { tryKeys, valueFor } from '../utils/json_util';
import { VWData } from './vw_data';

export class DUIPageDefinition {
    readonly pageId: string;
    readonly pageArgDefs?: Record<string, Variable>;
    readonly initStateDefs?: Record<string, Variable>;
    readonly layout?: { root?: VWData };
    readonly onPageLoad?: ActionFlow;
    readonly onBackPress?: ActionFlow;

    constructor({
        pageId,
        pageArgDefs: argDefs,
        initStateDefs,
        layout,
        onPageLoad,
        onBackPress
    }: {
        pageId: string;
        pageArgDefs?: Record<string, Variable>;
        initStateDefs?: Record<string, Variable>;
        layout?: { root?: VWData };
        onPageLoad?: ActionFlow;
        onBackPress?: ActionFlow;
    }) {
        this.pageId = pageId;
        this.pageArgDefs = argDefs;
        this.initStateDefs = initStateDefs;
        this.layout = layout;
        this.onPageLoad = onPageLoad;
        this.onBackPress = onBackPress;
    }

    static fromJson(json: JsonLike): DUIPageDefinition {
        return new DUIPageDefinition({
            pageId: tryKeys<string>(json, ['uid', 'pageUid', 'pageId']) ?? '',
            pageArgDefs: tryKeys<Record<string, Variable>>(
                json,
                ['inputArgs', 'pageArgDefs', 'argDefs'],
                {
                    parse: (p0: any) => {
                        const jsonLike = as$<JsonLike>(p0);
                        return jsonLike ? new VariableJsonConverter().fromJson(jsonLike) : null;
                    }
                }
            ) ?? undefined,
            initStateDefs: tryKeys<Record<string, Variable>>(
                json,
                ['variables', 'initStateDefs'],
                {
                    parse: (p0: any) => {
                        const jsonLike = as$<JsonLike>(p0);
                        return jsonLike ? new VariableJsonConverter().fromJson(jsonLike) : null;
                    }
                }
            ) ?? undefined,
            layout: (() => {
                const layoutRoot = as$<JsonLike>(json['layout']?.['root']);
                if (layoutRoot) {
                    const vwData = VWData.fromJson(layoutRoot);
                    return vwData ? { root: vwData } : undefined;
                }
                return undefined;
            })(),
            onPageLoad: as$<JsonLike>(valueFor(json, 'actions.onPageLoadAction'))?.maybe(ActionFlow.fromJson),
            onBackPress: as$<JsonLike>(valueFor(json, 'actions.onBackPress'))?.maybe(ActionFlow.fromJson),
        });
    }
}