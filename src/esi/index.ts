import * as got from "got";

interface CharacterObject {
  CharacterID: number;
  CharacterName: string;
  ExpiresOn: string;
  Scopes: string;
  TokenType: string;
  CharacterOwnerHash: string;
  IntellectualProperty: string;
}

interface RequestOptions {
  headers: {
    Authorization: string;
  };
  json: boolean;
}

/**
 * Base class for making ESI Requests
 */
export default class ESIRequest {
  token: string;
  character: CharacterObject;
  affiliations: any;
  constructor(token: string) {
    this.token = token;
  }

  /**
   * Helper method for calling the EVE API
   * @param path
   * @param options
   */
  async call(path: string, options: object = {}) {
    const requestOptions: RequestOptions = {
      headers: {
        Authorization: `Bearer ${this.token}`
      },
      json: true,
      ...options
    };
    const request = await got(
      `https://esi.tech.ccp.is/${path}`,
      requestOptions
    );
    return request.body;
  }

  /**
   * Get current logged in character
   */
  async getCharacter() {
    const { body: character }: { body: CharacterObject } = await got(
      "https://login.eveonline.com/oauth/verify",
      {
        headers: {
          Authorization: `Bearer ${this.token}`
        },
        json: true
      }
    );
    const affiliations = await this.call(`latest/characters/affiliation`, {
      method: "POST",
      body: [character.CharacterID]
    });
    this.character = character;
    this.affiliations = affiliations;
  }

  async getCorporationContracts() {
    const [{ corporation_id: corporationId }] = this.affiliations;
    let contracts = await this.call(
      `latest/corporations/${corporationId}/contracts`
    );
    contracts = (contracts as any)
      .filter(c => c.assignee_id === corporationId)
      .filter(c => c.status === "outstanding");
    return contracts;
  }
}
