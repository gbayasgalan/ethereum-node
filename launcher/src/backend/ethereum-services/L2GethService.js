import { NodeService } from "./NodeService.js";
import { ServiceVolume } from "./ServiceVolume.js";

export class L2GethService extends NodeService {
  // static buildByUserInput(network, dir, ports, executionClients) {
  static buildByUserInput(network, ports, dir, executionClients) {
    const service = new L2GethService();
    service.setId();
    const workingDir = service.buildWorkingDir(dir);

    // const JWTDir = "/op-engine.jwt";
    const dataDir = "/l2-geth";
    const volumes = [new ServiceVolume(workingDir + "/data", dataDir)];
    // const sequencer = network === "mainnet" ? "https://mainnet-sequencer.optimism.io" : "https://sepolia-sequencer.optimism.io";

    // // L2 geth
    // const l2Geth = executionClients
    //   .filter((client) => client.service.includes("L2GethService"))
    //   .map((client) => {
    //     return client.buildExecutionClientHttpEndpointUrl();
    //   })
    //   .join();

    service.init(
      "L2GethService", // service
      service.id, // id
      1, // configVersion
      "ethereumoptimism/l2geth", // image
      "0.5.31", // imageVersion
      ["--vmodule=eth/*=5,miner=4,rpc=5,rollup=4,consensus/clique=1", "--datadir=/l2geth", "--allow-insecure-unlock", "--gcmode=full"], // command
      ["geth"], // entrypoint
      {
        USING_OVM: "true",
        ETH1_SYNC_SERVICE_ENABLE: "false",
        RPC_API: "eth,rollup,net,web3,debug",
        RPC_ADDR: "0.0.0.0",
        RPC_CORS_DOMAIN: "*",
        RPC_ENABLE: "true",
        RPC_PORT: "8545",
        RPC_VHOSTS: "*",
      }, // env
      ports, // ports
      volumes, // volumes
      "root", // user
      network, // network
      executionClients
      // consensusClients
    );

    return service;
  }

  static buildByConfiguration(config) {
    const service = new L2GethService();

    service.initByConfig(config);

    return service;
  }

  buildExecutionClientEngineRPCEndpointUrl() {
    return "http://stereum-" + this.id + ":8545";
  }
}

// EOF
