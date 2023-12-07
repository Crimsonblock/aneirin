import path from "path";
import { Logger, LOG_LEVEL } from "./utils/Logger.mjs";
import { processEnvironmentVariables } from "./utils/utils.mjs";
import { existsSync, readFileSync, readSync } from "fs";

const CONFIG_FOLDER = "./config";

Logger.logLevel = LOG_LEVEL.DEBUG;
