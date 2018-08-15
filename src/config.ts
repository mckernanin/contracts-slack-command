import "dotenv/config";

const orEmptyString = value => value || "";
const numberOrDefault = (value, fallback) =>
  value ? Number(value) : Number(fallback);

interface EnvironmentVariables {
  esiId: string;
  esiSecret: string;
  redirectUrl: string;
  env: string;
  port: number;
  jwtSecret: string;
  jwtExpire: number;
}

const variables: EnvironmentVariables = {
  esiId: orEmptyString(process.env.ESI_CLIENT),
  esiSecret: orEmptyString(process.env.ESI_SECRET),
  redirectUrl: orEmptyString(process.env.REDIRECT_URL),
  env: orEmptyString(process.env.NODE_ENV),
  port: numberOrDefault(process.env.PORT, 1337),
  jwtSecret: orEmptyString(process.env.JWT_SECRET),
  jwtExpire: numberOrDefault(process.env.JWT_EXPIRE, 86400)
};

export default variables;
