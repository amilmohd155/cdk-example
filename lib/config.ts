import * as dotenv from "dotenv";
import path = require("path");

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

export type ConfigProps = {
  TABLE_NAME: string;
  EXTERNAL_ID: string;
  AWS_ROLE_ARN: string;
};

export const getConfig = (): ConfigProps => ({
  TABLE_NAME: process.env.TABLE_NAME || "znap-url-dynamodb-dev",
  EXTERNAL_ID: process.env.EXTERNAL_ID!,
  AWS_ROLE_ARN: process.env.AWS_ROLE_ARN!,
});
