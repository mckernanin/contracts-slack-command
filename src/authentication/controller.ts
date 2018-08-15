import { Request, Response, NextFunction } from "express";
import { sign } from "jsonwebtoken";
import config from "../config";
import ESIRequest from "../esi";
import { authorizationUri, getToken } from "./oauth";

export const login = (req: Request, res: Response) =>
  res.redirect(authorizationUri);

export const callback = async (req: Request, res: Response) => {
  const { code } = req.query;
  const token = await getToken(code);
  const esi = new ESIRequest(token.access_token);
  await esi.getCharacter();
  const jwt = sign({ token, character: esi.character }, config.jwtSecret, {
    expiresIn: config.jwtExpire
  });
  res.redirect(`/v1/slack/setup?jwt=${jwt}`);
};
