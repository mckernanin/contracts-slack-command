import { verify } from "jsonwebtoken";
import * as got from "got";
import config from "../config";
import ESI from "../esi";
import { checkAccessToken } from "../authentication/oauth";

interface TokenValues {
  token: {
    access_token: string;
  };
  character: {
    CharacterID: number;
    CharacterName: string;
    ExpiresOn: string;
    Scopes: string;
    TokenType: string;
    CharacterOwnerHash: string;
    IntellectualProperty: string;
  };
  iat: number;
  exp: number;
}

export const setup = (req, res) => {
  const { jwt } = req.query;
  res.send(`
  <style>
    div {
      font-family: 'Fira Code', sans-serif;
      max-width: 90vw;
      margin: 0 auto;
      overflow-wrap: break-word;
      padding: 2em;
    }
  </style>
  Use the following url in slack for the slash command:
  <div>http://localhost:1337/v1/slack/command?jwt=${jwt}</div>
  `);
};

export const command = async (req, res) => {
  const { response_url } = req.body;
  const { jwt } = req.query;
  res.status(200).send("Request received.");
  try {
    const decoded = verify(jwt, config.jwtSecret) as any;
    const accessToken = await checkAccessToken(decoded.token);
    const esi = new ESI(accessToken);
    await esi.getCharacter();
    const contracts = (await esi.getCorporationContracts()) as any;
    await got(response_url, {
      method: "POST",
      headers: {
        accept: "text/html",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        response_type: "in_channel",
        text: `There are currently ${contracts.length} contracts pending.`
      })
    });
  } catch (error) {
    await got(response_url, {
      method: "POST",
      json: true,
      body: {
        response_type: "ephemeral",
        text: "Sorry, that didn't work. Please try again."
      }
    });
  }
  return;
};