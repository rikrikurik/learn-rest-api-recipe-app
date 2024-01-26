import * as path from 'path';
import { Construct } from 'constructs';
import { ResourceName } from '../lib/resource_name';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface GetFunctionProps {
  resourceName: ResourceName;
  table: dynamodb.ITable;
}
export class GetFunction extends Construct {
  function: lambda.Function;
  
  constructor(scope: Construct, id: string, props: GetFunctionProps) {
    super(scope, id);

    //==========================================================================
    // Lambda FunctionのRoleを定義
    const lambdaRole = new iam.Role(this, `function-role`, {
      roleName: props.resourceName.roleName(`get-function`),
      description: `${props.resourceName.systemName} - get item function role`,
      assumedBy: new iam.ServicePrincipal(`lambda.amazonaws.com`),
      managedPolicies: [
        // Lambda用基本ポリシーを追加
        iam.ManagedPolicy.fromAwsManagedPolicyName(`service-role/AWSLambdaBasicExecutionRole`),
      ]
    });
    props.table.grantReadData(lambdaRole); // テーブルの読み込み権限を追加

    //==========================================================================
    // 既存レシピを取得するLambda Functionを作成する
    this.function = new lambda.Function(this, `function`, {
      functionName: props.resourceName.lambdaName(`get`),
      description: `${props.resourceName.systemName} - get item function`,
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'get_function.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      role: lambdaRole,
      environment: {
        'TABLE_NAME': props.table.tableName
      }
    });
  }
}
