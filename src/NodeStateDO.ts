import { DurableObjectState } from "cloudflare:workers";

export class NodeStateDO {
  constructor(state: DurableObjectState) {}
  async fetch(request: Request) {
    return new Response("NodeStateDO is working", { status: 200 });
  }
}