import { DataSource } from "typeorm";
import { ChatOpenAI } from "@langchain/openai";
import { SqlDatabase } from "langchain/sql_db";
import { createSqlQueryChain } from "langchain/chains/sql_db";

const datasource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  synchronize: true,
  logging: true,
  database: process.DATABASE,
});

const AgentModule = "gpt-3.5-turbo";
const llm = new ChatOpenAI({ modelName: "gpt-4", temperature: 0 });
const Agentllm = new ChatOpenAI({ modelName: AgentModule, temperature: 0 });
const database = async () =>  await SqlDatabase.fromDataSourceParams({ appDataSource: datasource });

const writeQueryLc = async (db,dialect) => await createSqlQueryChain({
    llm,
    db,
    dialect,
  });


module.exports = {
  datasource,
  llm,
  database,
  writeQueryLc,
  Agentllm,
};
