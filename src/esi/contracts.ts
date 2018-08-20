import * as NodeCache from "node-cache";
import { flattenDeep, uniq } from "lodash";
import ESIRequest from "./index";

const locationCache = new NodeCache({ deleteOnExpire: false });

const isStructureId = (id: number) => id > 2147483647;

export interface Contract {
  start_location_id: number;
  end_location_id: number;
  volume: number;
  reward: number;
  assignee_id: number;
  status: string;
}

export type Contracts = Array<Contract>;

export default class ESIContracts extends ESIRequest {
  /**
   * Get all contracts for current character's corporation
   */
  async getCorporationContracts(): Promise<Contracts> {
    if (!this.character) {
      await this.getCharacter();
    }
    const [{ corporation_id: corporationId }] = this.affiliations;
    let contracts: Contracts = await this.call(
      `latest/corporations/${corporationId}/contracts`
    );
    contracts = contracts
      .filter(c => c.assignee_id === corporationId)
      .filter(c => c.status === "outstanding");
    return contracts;
  }

  getLocationIds(contracts) {
    const ids = contracts.map(({ start_location_id, end_location_id }) => [
      start_location_id,
      end_location_id
    ]);
    const unique: Array<number> = uniq(flattenDeep(ids));
    const citadels = unique.filter(id => isStructureId(id));
    const npc = unique.filter(id => !isStructureId(id));
    return { citadels, npc };
  }

  async lookupLocations(contracts: Contracts): Promise<any> {
    const { citadels, npc } = this.getLocationIds(contracts);
    const [names, structures] = await Promise.all([
      this.getNames(npc),
      this.getStructures(citadels)
    ]);
    return { names, structures };
  }
}
