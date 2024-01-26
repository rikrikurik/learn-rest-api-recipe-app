import * as path from 'path';
import { Construct } from 'constructs';
import { ResourceName } from '../lib/resource_name';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface GetAllFunctionProps {
  resourceName: ResourceName;
  table: dynamodb.ITable;
}
export class GetAllFunction extends Construct {
  function: lambda.Function;
  
  constructor(scope: Construct, id: string, props: GetAllFunctionProps) {
    super(scope, id);

    //==========================================================================
    // Lambda FunctionのRoleを定義
    const lambdaRole = new iam.Role(this, `function-role`, {
      roleName: props.resourceName.roleName(`get-all-function`),
      description: `${props.resourceName.systemName} - get all item function role`,
      assumedBy: new iam.ServicePrincipal(`lambda.amazonaws.com`),
      managedPolicies: [
        // Lambda用基本ポリシーを追加
        iam.ManagedPolicy.fromAwsManagedPolicyName(`service-role/AWSLambdaBasicExecutionRole`),
      ]
    });
    props.table.grantReadData(lambdaRole); // テーブルデータの読みこみ権限を追加

    //==========================================================================
    // 新規レシピを登録するLambda Functionを作成する
    this.function = new lambda.Function(this, `function`, {
      functionName: props.resourceName.lambdaName(`get-all`),
      description: `${props.resourceName.systemName} - get all item function`,
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'get_all_function.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      role: lambdaRole,
      environment: {
        'TABLE_NAME': props.table.tableName
      }
    });
  }
}
