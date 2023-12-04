import DbManager from "./DbManager.mjs";
import { DataTypes } from "sequelize";
import process from "process";
import User from "./models/User.js";

var db: DbManager = DbManager.getInstance({uri: "sqlite:dev.sqlite"});
if (!await db.connect()) {
    console.log("Unable to connect to the database");
    process.exit(-1)
}
console.log("Connection successful");

await User.init(User.modelAttributes, {sequelize: db.getSequelize(), modelName: "User"});
await User.sync();

console.log(await User.findAll())

var me = await User.create({username: "crimsonblock", password:"test", salt:"test"})

console.log(await User.findOne({where: {username: "crimsonblock"}}))
me.set("isAdmin", true);
await me.save();
console.log(await User.findOne({where: {username: "crimsonblock"}}))

await db.close();