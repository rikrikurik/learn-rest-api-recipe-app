import { aws_apigateway } from "aws-cdk-lib";
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

import { ResourceName } from './resource_name';
import { PostFunction } from './post_function';
import { GetAllFunction } from './get_all_function';
import { GetFunction } from './get_function';
import { PatchFunction } from './patch_function';
import { DeleteFunction } from './delete_function';

export interface ApiProps {
  resourceName: ResourceName;
  postFunction: PostFunction;
  getAllFunction: GetAllFunction;
  getFunction: GetFunction;
  patchFunction: PatchFunction;
  deleteFunction: DeleteFunction;
}

export class Api extends Construct {

  constructor(scope: Construct, id: string, props: ApiProps) {
    super(scope, id);

    //==========================================================================
    // API Gatewayを作成
    const restApi = new aws_apigateway.RestApi(this, "rest-api", {
      restApiName: `${props.resourceName.systemName}-api`,
      deployOptions: {
        loggingLevel: aws_apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
    });
    restApi.addGatewayResponse('gateway-response', {
      type: apigateway.ResponseType.DEFAULT_4XX,
      statusCode: '404',
    });
    //==========================================================================
    // /recipes APIを作成
    const recipes = restApi.root.addResource("recipes");
    // /recipes/{id} APIを作成
    const recipe = recipes.addResource('{id}');
    //==========================================================================
    // /recipes APIにLambda関数を統合

    // 新規レシピ登録関数をPOSTメソッドとして統合
    const postIntegration = new aws_apigateway.LambdaIntegration(
      props.postFunction.function
    );
    recipes.addMethod("POST", postIntegration);

    // 全アイテム取得関数をGETメソッドとして統合
    const getAllIntegration = new aws_apigateway.LambdaIntegration(
      props.getAllFunction.function
    );
    recipes.addMethod("GET", getAllIntegration);

    //==========================================================================
    // /recipes/{id} APIにLambda関数を統合

    // 既存レシピ更新関数をPATCHメソッドとして統合
    const patchIntegration = new aws_apigateway.LambdaIntegration(
      props.patchFunction.function,
    );
    recipe.addMethod("PATCH", patchIntegration);

    // レシピ取得関数をGETメソッドとして統合
    const getIntegration = new aws_apigateway.LambdaIntegration(
      props.getFunction.function,
    );
    recipe.addMethod("GET", getIntegration);

    // 既存レシピ削除関数をDELETEメソッドとして統合
    const deleteIntegration = new aws_apigateway.LambdaIntegration(
      props.deleteFunction.function,
    );
    recipe.addMethod("DELETE", deleteIntegration);
  }
}
