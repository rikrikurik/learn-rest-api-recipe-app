import * as path from 'path';
import { Construct } from 'constructs';
import { ResourceName } from '../lib/resource_name';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';

export interface PostFunctionProps {
  resourceName: ResourceName;
  table: dynamodb.ITable;
}
export class PostFunction extends Construct {
  function: lambda.Function;
  
  constructor(scope: Construct, id: string, props: PostFunctionProps) {
    super(scope, id);

    //==========================================================================
    // item Id管理用にインクリメントカウンタを作成し，0で初期化
    const counter = new ssm.StringParameter(this, `increment-counter`, {
      parameterName: props.resourceName.ssmParamName(`item-id-counter`),
      stringValue: '0'
    });

    //==========================================================================
    // Lambda FunctionのRoleを定義
    const lambdaRole = new iam.Role(this, `function-role`, {
      roleName: props.resourceName.roleName(`post-function`),
      description: `${props.resourceName.systemName} - new item create function role`,
      assumedBy: new iam.ServicePrincipal(`lambda.amazonaws.com`),
      managedPolicies: [
        // Lambda用基本ポリシーを追加
        iam.ManagedPolicy.fromAwsManagedPolicyName(`service-role/AWSLambdaBasicExecutionRole`),
      ]
    });
    props.table.grantReadWriteData(lambdaRole); // テーブルへの読み書き権限を追加
    counter.grantRead(lambdaRole); // インクリメントカウンタの読み込み権限を追加
    counter.grantWrite(lambdaRole); // インクリメントカウンタの書き込み権限を追加

    //==========================================================================
    // 新規レシピを登録するLambda Functionを作成する
    this.function = new lambda.Function(this, `function`, {
      functionName: props.resourceName.lambdaName(`post`),
      description: `${props.resourceName.systemName} - new item create function`,
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'post_function.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      role: lambdaRole,
      environment: {
        'TABLE_NAME': props.table.tableName,
        'COUNTER_NAME': counter.parameterName,
      }
    });
  }
}
