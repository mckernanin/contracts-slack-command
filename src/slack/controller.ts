import { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";
import * as got from "got";
import config from "../config";
import ESI, { Contracts, Contract } from "../esi/contracts";
import { checkAccessToken } from "../authentication/oauth";
import { toISK, toM3 } from "../utils/formatting";

/**
 * Give the user a url with authentication to use to configure slack webhooks
 */
export const setup = (req: Request, res: Response) => {
  const { jwt } = req.query;
  res.send(`
  <style>
    div {
      font-family: 'Fira Code', 'Menlo', monospace;
      max-width: 90vw;
      margin: 0 auto;
      overflow-wrap: break-word;
      padding: 2em;
    }
  </style>
  Use the following url in slack for the slash command:
  <div>${config.redirectUrl}/v1/slack/command?jwt=${jwt}</div>
  `);
};

const formatContractResponse = ({
  start_location_id,
  end_location_id,
  volume,
  reward
}: Contract): string =>
  `Contract from ${start_location_id} to ${end_location_id}. Volume: ${toM3(
    volume
  )} m3. Reward: ${toISK(reward)}`;

/**
 * Slack command handler
 */
export const command = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { response_url } = req.body;
  const { jwt } = req.query;
  const isSlackRequest = req.method === "POST";
  try {
    if (isSlackRequest) {
      res.status(200).send("Request received.");
    }
    const decoded = verify(jwt, config.jwtSecret) as any;
    const accessToken = await checkAccessToken(decoded.token);
    const esi = new ESI(accessToken);
    const contracts = await esi.getCorporationContracts();
    // const locations = await esi.lookupLocations(contracts);
    if (isSlackRequest) {
      await got(response_url, {
        method: "POST",
        headers: {
          accept: "text/html",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          response_type: "in_channel",
          text: `There are currently ${
            contracts.length
          } contracts pending. \n ${contracts
            .map(formatContractResponse)
            .join("\n")}`
        })
      });
    } else {
      res.status(200).json({
        contracts,
        formattedContracts: contracts.map(formatContractResponse)
        // locations
      });
    }
  } catch (error) {
    if (isSlackRequest) {
      await got(response_url, {
        method: "POST",
        json: true,
        body: {
          response_type: "ephemeral",
          text: `Sorry, that didn't work. Please try again. \n ${error.message}`
        }
      });
    } else {
      console.dir(error);
    }
  }
  return next("router");
};
