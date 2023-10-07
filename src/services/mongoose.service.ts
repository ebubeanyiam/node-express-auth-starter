import mongoose from "mongoose";
import config from "config";

const mongoUri = config.get<string>("mongoUri");
import { DatabaseConnectionError } from "../errors/database-connection-error";

// print mongoose logs
mongoose.set("debug", true);

/**
 * Connect to mongo db
 *
 * @returns {object} Mongoose connection
 * @public
 */
export const connect = (): object => {
  if (!mongoUri) throw new DatabaseConnectionError();

  mongoose.set("strictQuery", false);
  mongoose.connect(mongoUri);
  return mongoose.connection;
};
