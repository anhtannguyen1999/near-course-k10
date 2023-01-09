import {
  assert,
  NearBindgen,
  near,
  call,
  view,
  initialize,
  LookupMap,
  UnorderedMap,
} from "near-sdk-js";
import { AccountId } from "near-sdk-js/lib/types";

class NFTContractMetadata {
  spec: string; // required; essentially a version like "nft-2.1.0"; replacing "2.1.0" with the implemented version of NEP-177
  name: string; // required; ex. "Mochi Rising — Digital Edition" or "Metaverse 3"
  symbol: string; // required; ex. "MOCHI"
  icon: string | null; // Data URL
  base_uri: string | null; // Centralized gateway known to have reliable access to decentralized storage assets referenced by `reference` or `media` URLs
  reference: string | null; // URL to a JSON file with more info
  reference_hash: string | null; // Base64-encoded sha256 hash of JSON from reference field. Required if `reference` is included.
}

class TokenMetadata {
  title: string | null; // ex. "Arch Nemesis: Mail Carrier" or "Parcel #5055"
  description: string | null; // free-form description
  media: string | null; // URL to associated media; preferably to decentralized; content-addressed storage
  media_hash: string | null; // Base64-encoded sha256 hash of content referenced by the `media` field. Required if `media` is included.
  copies: number | null; // number of copies of this set of metadata in existence when token was minted.
  issued_at: number | null; // When token was issued or minted; Unix epoch in milliseconds
  expires_at: number | null; // When token expires; Unix epoch in milliseconds
  starts_at: number | null; // When token starts being valid; Unix epoch in milliseconds
  updated_at: number | null; // When token was last updated; Unix epoch in milliseconds
  extra: string | null; // anything extra the NFT wants to store on-chain. Can be stringified JSON.
  reference: string | null; // URL to an off-chain JSON file with more info.
  reference_hash: string | null; // Base64-encoded sha256 hash of JSON from reference field. Required if `reference` is included.
}

class Token {
  token_id: number;
  owner_id: AccountId;
  metadata: TokenMetadata;

  constructor(token_id: number, owner_id: AccountId, metadata: TokenMetadata) {
    (this.token_id = token_id),
      (this.owner_id = owner_id),
      (this.metadata = metadata);
  }
}

@NearBindgen({})
class Contract {
  owner_id: AccountId;
  token_id: number;
  owner_by_id: LookupMap;
  token_by_id: LookupMap;
  metadata: NFTContractMetadata;
  constructor() {
    this.token_id = 0;
    this.owner_id = "";
    this.owner_by_id = new LookupMap("o");
    this.token_by_id = new LookupMap("t");
    this.metadata = {
      spec: "nft-2.1.0",
      name: "ATDEMO Token",
      symbol: "ATD",
    } as NFTContractMetadata;
  }

  @initialize({})
  init({ owner_id, prefix }: { owner_id: AccountId; prefix: string }) {
    this.token_id = 0;
    this.owner_id = owner_id;
    this.owner_by_id = new LookupMap(prefix);
    this.token_by_id = new LookupMap("t");
  }

  @call({}) // token_id = 0
  mint_nft({ token_owner_id, metadata }) {
    this.owner_by_id.set(this.token_id.toString(), token_owner_id); //{tokenId = 0, 'atdemo.testnet'}

    let token = new Token(this.token_id, token_owner_id, metadata);

    this.token_by_id.set(this.token_id.toString(), token);

    this.token_id++;

    return token;
  }

  @view({})
  get_token_by_id({ token_id }: { token_id: number }) {
    let token = this.token_by_id.get(token_id.toString());

    if (token === null) {
      return null;
    }

    return token;
  }

  @view({})
  get_supply_tokens() {
    return this.token_id;
  }

  @view({})
  get_all_tokens({ start, max }: { start?: number; max?: number }) {
    let all_tokens = [];
    start = start ? start : 0;
    max = max ? max : this.token_id;
    assert(start >= 0, "start must be greater than 0");
    assert(max >= 0, "max must be greater than 0");
    assert(start < max, "start must be less than max");
    for (let i = start; i < max; i++) {
      all_tokens.push(this.token_by_id.get(i.toString()));
    }

    return all_tokens;
  }

  // Standard implement
  @view({})
  nft_metadata(): NFTContractMetadata {
    assert(this.metadata !== null, "Metadata not initialized");
    return this.metadata;
  }

  // Core functions
  @call({})
  nft_transfer(
    receiver_id: string,
    token_id: string,
    approval_id: number | null,
    memo: string | null
  ) {
    let token = this.token_by_id.get(token_id.toString());

    assert(token !== null, "Token not found");

    this.owner_by_id.set(token_id.toString(), receiver_id); //{tokenId = 0, 'atdemo.testnet'}

    token.owner_id = receiver_id;
  }

  @call({})
  nft_transfer_call(
    receiver_id: string,
    token_id: string,
    msg: string,
    approval_id: number | null,
    memo: string | null
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {});
  }

  @view({})
  nft_token(token_id: string): Token | null {
    return this.token_by_id.get(token_id.toString());
  }

  @call({})
  nft_resolve_transfer(
    previous_owner_id: string,
    receiver_id: string,
    token_id: string,
    approved_account_ids: null | Record<string, number>
  ): boolean {
    return false;
  }

  @call({})
  nft_on_transfer(
    sender_id: string,
    previous_owner_id: string,
    token_id: string,
    msg: string
  ): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {});
  }
}
