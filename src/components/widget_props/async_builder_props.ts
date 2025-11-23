import { ExprOr, JsonLike } from "../../framework";
import { ActionFlow } from "../../framework/actions/base/action_flow";
import AsyncController from "../internals/async/async_controller";


export class AsyncBuilderProps {
    readonly future?: ExprOr<JsonLike> | null;
    readonly controller?: ExprOr<AsyncController<any>> | null;
    readonly initialData?: ExprOr<any> | null;
    readonly onSuccess?: ActionFlow | null;
    readonly onError?: ActionFlow | null;

    constructor({
        future,
        controller,
        initialData,
        onSuccess,
        onError,
    }: {
        future?: ExprOr<JsonLike> | null;
        controller?: ExprOr<AsyncController<any>> | null;
        initialData?: ExprOr<any> | null;
        onSuccess?: ActionFlow | null;
        onError?: ActionFlow | null;
    }) {
        this.future = future;
        this.controller = controller;
        this.initialData = initialData;
        this.onSuccess = onSuccess;
        this.onError = onError;
    }

    static fromJson(json: JsonLike | null): AsyncBuilderProps {
        return new AsyncBuilderProps({
            future: ExprOr.fromJson<JsonLike>(json?.['future']),
            controller: ExprOr.fromJson<AsyncController<any>>(json?.['controller']),
            initialData: ExprOr.fromJson<any>(json?.['initialData']),
            onSuccess: ActionFlow.fromJson(json?.['onSuccess']),
            onError: ActionFlow.fromJson(json?.['onError']),
        });
    }
}