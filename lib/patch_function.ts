import * as path from 'path';
import { Construct } from 'constructs';
import { ResourceName } from '../lib/resource_name';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface PatchFunctionProps {
  resourceName: ResourceName;
  table: dynamodb.ITable;
}
export class PatchFunction extends Construct {
  function: lambda.Function;
  
  constructor(scope: Construct, id: string, props: PatchFunctionProps) {
    super(scope, id);

    //==========================================================================
    // Lambda FunctionのRoleを定義
    const lambdaRole = new iam.Role(this, `function-role`, {
      roleName: props.resourceName.roleName(`patch-function`),
      description: `${props.resourceName.systemName} - update item function role`,
      assumedBy: new iam.ServicePrincipal(`lambda.amazonaws.com`),
      managedPolicies: [
        // Lambda用基本ポリシーを追加
        iam.ManagedPolicy.fromAwsManagedPolicyName(`service-role/AWSLambdaBasicExecutionRole`),
      ]
    });
    props.table.grantReadWriteData(lambdaRole); // テーブルへの読み書き権限を追加

    //==========================================================================
    // 新規レシピを登録するLambda Functionを作成する
    this.function = new lambda.Function(this, `function`, {
      functionName: props.resourceName.lambdaName(`patch`),
      description: `${props.resourceName.systemName} - update item function`,
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'patch_function.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      role: lambdaRole,
      environment: {
        'TABLE_NAME': props.table.tableName
      }
    });
  }
}
