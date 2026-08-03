import * as dotenv from 'dotenv';
import * as Joi from 'joi';

dotenv.config({
  path:
    process.env.NODE_ENV === 'production'
      ? '.env.production'
      : '.env.development',
});

interface EnvironmentsVariables {
  NODE_ENV: 'development' | 'production' | 'test' | 'provision';
  DATABASE_PORT: number;
  DATABASE_HOST: string;
  DATABASE_USER: string;
  DATABASE_PASSWORD: string;
  DATABASE_NAME: string;
  DEBUG: boolean;
  ALLOWED_HOSTS: string;
  SECRET_KEY: string;
  KAFKA_BROKER_URL: string;
  KAFKA_TOPIC: string;
  EPAA_LEGACY_READINGS_KAFKA_CLIENT_ID: string;
  EPAA_LEGACY_READINGS_KAFKA_GROUP_ID: string;
  EPAA_LEGACY_READINGS_KAFKA_CLIENT: string;
  KAFKA_BROKER_INTERNAL: string;
  KAFKA_BROKER_EXTERNAL: string;
  DATABASE_TYPE: 'sqlserver_2000' | 'sqlserver_2022';
  POSTGRESQL_HOST: string;
  POSTGRESQL_PORT: number;
  POSTGRESQL_USER: string;
  POSTGRESQL_PASSWORD: string;
  POSTGRESQL_DATABASE: string;
}

const environmentsSchema = Joi.object<EnvironmentsVariables>({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'provision')
    .required(),
  DATABASE_PORT: Joi.number().default(1433),
  DATABASE_HOST: Joi.string().required(),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_NAME: Joi.string().required(),
  DEBUG: Joi.boolean().default(false),
  ALLOWED_HOSTS: Joi.string().required(),
  SECRET_KEY: Joi.string().required(),
  KAFKA_BROKER_URL: Joi.string().required(),
  KAFKA_TOPIC: Joi.string().required(),
  EPAA_LEGACY_READINGS_KAFKA_CLIENT_ID: Joi.string().required(),
  EPAA_LEGACY_READINGS_KAFKA_GROUP_ID: Joi.string().required(),
  EPAA_LEGACY_READINGS_KAFKA_CLIENT: Joi.string().required(),
  KAFKA_BROKER_INTERNAL: Joi.string().required(),
  KAFKA_BROKER_EXTERNAL: Joi.string().required(),
  DATABASE_TYPE: Joi.string()
    .valid('sqlserver_2000', 'sqlserver_2022')
    .default('sqlserver_2022'),
}).unknown(true);

const { error, value: envVars } = environmentsSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const environments: EnvironmentsVariables = {
  NODE_ENV: envVars.NODE_ENV,
  DATABASE_PORT: Number(envVars.DATABASE_PORT),
  DATABASE_HOST: envVars.DATABASE_HOST,
  DATABASE_USER: envVars.DATABASE_USER,
  DATABASE_PASSWORD: envVars.DATABASE_PASSWORD,
  DATABASE_NAME: envVars.DATABASE_NAME,
  DEBUG: envVars.DEBUG === true,
  ALLOWED_HOSTS: envVars.ALLOWED_HOSTS,
  SECRET_KEY: envVars.SECRET_KEY,
  KAFKA_BROKER_URL:
    envVars.KAFKA_BROKER_INTERNAL || envVars.KAFKA_BROKER_EXTERNAL,
  KAFKA_TOPIC: envVars.KAFKA_TOPIC,
  EPAA_LEGACY_READINGS_KAFKA_CLIENT_ID:
    envVars.EPAA_LEGACY_READINGS_KAFKA_CLIENT_ID,
  EPAA_LEGACY_READINGS_KAFKA_GROUP_ID:
    envVars.EPAA_LEGACY_READINGS_KAFKA_GROUP_ID,
  EPAA_LEGACY_READINGS_KAFKA_CLIENT: envVars.EPAA_LEGACY_READINGS_KAFKA_CLIENT,
  KAFKA_BROKER_EXTERNAL: envVars.KAFKA_BROKER_EXTERNAL,
  KAFKA_BROKER_INTERNAL: envVars.KAFKA_BROKER_INTERNAL,
  DATABASE_TYPE: envVars.DATABASE_TYPE as 'sqlserver_2000' | 'sqlserver_2022',
  POSTGRESQL_HOST: envVars.POSTGRESQL_HOST,
  POSTGRESQL_PORT: Number(envVars.POSTGRESQL_PORT),
  POSTGRESQL_USER: envVars.POSTGRESQL_USER,
  POSTGRESQL_PASSWORD: envVars.POSTGRESQL_PASSWORD,
  POSTGRESQL_DATABASE: envVars.POSTGRESQL_DATABASE,
};
