import * as path from 'path';
import { Construct } from 'constructs';
import { ResourceName } from '../lib/resource_name';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface DeleteFunctionProps {
  resourceName: ResourceName;
  table: dynamodb.ITable;
}
export class DeleteFunction extends Construct {
  function: lambda.Function;
  
  constructor(scope: Construct, id: string, props: DeleteFunctionProps) {
    super(scope, id);

    //==========================================================================
    // Lambda FunctionのRoleを定義
    const lambdaRole = new iam.Role(this, `function-role`, {
      roleName: props.resourceName.roleName(`delete-function`),
      description: `${props.resourceName.systemName} - delete item function role`,
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
      functionName: props.resourceName.lambdaName(`delete`),
      description: `${props.resourceName.systemName} - delete item function`,
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'delete_function.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      role: lambdaRole,
      environment: {
        'TABLE_NAME': props.table.tableName
      }
    });
  }
}
