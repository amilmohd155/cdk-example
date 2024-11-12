#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CdkExampleStack } from "../lib/cdk-example-stack";
import { getConfig } from "../lib/config";

const config = getConfig();

const app = new cdk.App();

new CdkExampleStack(app, "CdkExampleStack", { config });
