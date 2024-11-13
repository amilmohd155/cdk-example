import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import {
  AccessKey,
  ArnPrincipal,
  CfnAccessKey,
  Effect,
  Group,
  Policy,
  PolicyStatement,
  Role,
  User,
} from "aws-cdk-lib/aws-iam";
import { ConfigProps } from "./config";

type CdkExampleStackProps = cdk.StackProps & {
  config: Readonly<ConfigProps>;
};

export class CdkExampleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CdkExampleStackProps) {
    super(scope, id, props);

    const { config } = props;

    const table = new dynamodb.TableV2(this, config.TABLE_NAME, {
      tableName: config.TABLE_NAME,
      partitionKey: {
        name: "PK",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "SK",
        type: dynamodb.AttributeType.STRING,
      },
      timeToLiveAttribute: "expires",
      billing: dynamodb.Billing.onDemand(),
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code
    });

    table.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: {
        name: "GSI1PK",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "GSI1SK",
        type: dynamodb.AttributeType.STRING,
      },
    });
    // const group = new Group(this, "ZnapURLGroup", {
    //   groupName: "ZnapURLGroup",
    // });

    const user = new User(this, "DynamodbAccessUser", {
      userName: "Znap-URL-DynamodbAcessUser",
      // groups: [group],
    });

    const dynamodbAccessPolicy = new Policy(this, "dynamodbAccessPolicy", {
      policyName: "Znap-URL-DynamodbAccessPolicy",
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            "dynamodb:GetItem",
            "dynamodb:PutItem",
            "dynamodb:UpdateItem",
            "dynamodb:DeleteItem",
            "dynamodb:Query",
            "dynamodb:Scan",
          ],
          resources: [table.tableArn],
        }),
      ],
    });

    const dynamodbAccessRole = new Role(this, "DynamodbAccessRole", {
      roleName: "Znap-URL-DynamodbAccessRole",
      assumedBy: new ArnPrincipal(user.userArn),
      // assumedBy: new ArnPrincipal(group.groupArn),
      externalIds: [config.EXTERNAL_ID],
    });

    dynamodbAccessPolicy.attachToRole(dynamodbAccessRole);

    const assumeRolePolicy = new Policy(this, "AssumeRolePolicy", {
      policyName: "Znap-URL-AssumeRolePolicy",
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ["sts:AssumeRole"],
          resources: [dynamodbAccessRole.roleArn],
        }),
      ],
    });

    assumeRolePolicy.attachToUser(user);
    // assumeRolePolicy.attachToGroup(group);

    // const accessKey = new CfnAccessKey(this, "CfnAccessKey", {
    //   userName: user.userName,
    // });

    const accessKey = new AccessKey(this, "AccessKey", {
      user,
    });

    const templatedSecret = new secretsmanager.Secret(this, "TemplatedSecret", {
      secretName: "znap-url-secret",
      secretObjectValue: {
        AWS_ACCESS_KEY_ID: cdk.SecretValue.unsafePlainText(
          accessKey.accessKeyId
        ),
        AWS_SECRET_ACCESS_KEY: accessKey.secretAccessKey,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code
    });

    templatedSecret.grantRead(new ArnPrincipal(config.AWS_ROLE_ARN));

    // templatedSecret.grantRead(dynamodbAccessRole);

    new cdk.CfnOutput(this, "secretsManagerArn", {
      value: templatedSecret.secretArn,
      exportName: "secretsManagerArn",
    });

    // new cdk.CfnOutput(this, "accessKeyId", {
    //   value: accessKey.accessKeyId,
    //   exportName: "accessKey",
    // });

    // new cdk.CfnOutput(this, "secretAccessKey", {
    //   value: accessKey.secretAccessKey.toString(),
    //   exportName: "secretAccessKey",
    // });
  }
}

// Overall flow.
// 1. Create the stack ✅
// 2. Create a new table ✅
// 3. Add a global secondary index ✅
// 4. Create a client iam user ✅
// 5. Create a policy to allow access the table using table arn ✅
// 6. Create a role with the client iam user arn as principal and externalID (added security) and attach the policy from step 5 ✅
// 7. Create a policy that allows the user to assume the role (using sts) in step 6 with the role arn ✅
// 8. Attach the policy from step 7 to the client iam user ✅
// 9. Return the new user accesskey and secretkey to the env (github)

// ? Try to create a group that policy from step 7 gets attached to and client iam user gets added to the group ❌

/*
 * Older version
 */

// const role = new Role(this, "DynamodbAccessRole", {
//   assumedBy: new ServicePrincipal("dynamodb.amazonaws.com"),

// ! use arn, get arn from the user created above (yet to be implmented)
// assumedBy: new ArnPrincipal(
//   "arn:aws:iam::aws:principal/dynamodb"
// ).withConditions({
//   StringEquals: {
//     "sts:ExternalId": "dynamodb.amazonaws.com",
//   },
// }),

/*
 * test with externalIds props to see if it works, instead of withConditions
 */
// externalIds: ["dynamodb.amazonaws.com"],

// });

// role.addToPolicy(
//   new PolicyStatement({
//     actions: [
//       "dynamodb:GetItem",
//       "dynamodb:PutItem",
//       "dynamodb:UpdateItem",
//       "dynamodb:DeleteItem",
//       "dynamodb:Query",
//       "dynamodb:Scan",
//     ],
//     resources: [table.tableArn],
//   })
// );
