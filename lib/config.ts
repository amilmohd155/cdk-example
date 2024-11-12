import * as dotenv from "dotenv";
import path = require("path");

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

export type ConfigProps = {
  TABLE_NAME: string;
  EXTERNAL_ID: string;
};

export const getConfig = (): ConfigProps => ({
  TABLE_NAME: process.env.TABLE_NAME || "znap-url-dynamodb-dev",
  EXTERNAL_ID: process.env.EXTERNAL_ID!,
});
