import { NodeService } from "./NodeService.js";
import { ServiceVolume } from "./ServiceVolume.js";

export class OpGethService extends NodeService {
  static buildByUserInput(network, ports, dir, executionClients) {
    const service = new OpGethService();
    service.setId();
    const workingDir = service.buildWorkingDir(dir);

    const JWTDir = "/op-engine.jwt";
    const dataDir = "/op-geth";
    const volumes = [new ServiceVolume(workingDir + "/data", dataDir), new ServiceVolume(workingDir + "/op-engine.jwt", JWTDir)];
    const sequencer = network === "mainnet" ? "https://mainnet-sequencer.optimism.io" : "https://sepolia-sequencer.optimism.io";

    // L2 geth
    const l2Geth = executionClients
      .filter((client) => client.service.includes("L2GethService"))
      .map((client) => {
        return client.buildExecutionClientRPCEndpointUrl();
      })
      .join();

    const cmd = service.generateGethCommand(dataDir, JWTDir, sequencer, network, l2Geth);

    service.init(
      "OpGethService", // service
      service.id, // id
      1, // configVersion
      "us-docker.pkg.dev/oplabs-tools-artifacts/images/op-geth", // image
      "v1.101411.4", // imageVersion
      cmd, // command
      ["geth"], // entrypoint
      null, // env
      ports, // ports
      volumes, // volumes
      "root", // user
      "op-" + network, // network
      executionClients ? executionClients : [] // executionClients
      // consensusClients
    );

    return service;
  }

  generateGethCommand(dataDir, JWTDir, sequencer, network, l2Geth) {
    const commonCmd = [
      `--datadir=${dataDir}`,
      `--http`,
      `--http.corsdomain=*`,
      `--http.vhosts=*`,
      `--http.addr=0.0.0.0`,
      `--http.port=8545`,
      `--http.api=web3,debug,eth,txpool,net,engine`,
      `--ws`,
      `--ws.addr=0.0.0.0`,
      `--ws.port=8546`,
      `--ws.origins=*`,
      `--ws.api=debug,eth,txpool,net,engine,web3`,
      `--syncmode=snap`,
      `--gcmode=full`,
      `--state.scheme=hash`,
      `--authrpc.vhosts=*`,
      `--authrpc.addr=0.0.0.0`,
      `--authrpc.port=8551`,
      `--authrpc.jwtsecret=${JWTDir}`,
      `--rollup.sequencerhttp=${sequencer}`,
      `--rollup.disabletxpoolgossip=true`,
      `--port=39393`,
      `--discovery.port=39393`,
      `--db.engine=pebble`,
      `--op-network=op-${network}`,
      `--metrics`,
      `--metrics.expensive`,
      `--metrics.port=6060`,
      `--metrics.addr=0.0.0.0`,
    ];

    return network === "mainnet" ? [...commonCmd, `--rollup.historicalrpc=${l2Geth}`] : commonCmd;
  }

  static buildByConfiguration(config) {
    const service = new OpGethService();

    service.initByConfig(config);

    return service;
  }

  buildExecutionClientHttpEndpointUrl() {
    return "http://stereum-" + this.id + ":8545";
  }

  buildExecutionClientWsEndpointUrl() {
    return "ws://stereum-" + this.id + ":8546";
  }

  buildExecutionClientEngineRPCHttpEndpointUrl() {
    return "http://stereum-" + this.id + ":8551";
  }

  buildExecutionClientEngineRPCWsEndpointUrl() {
    return "ws://stereum-" + this.id + ":8551";
  }

  buildExecutionClientMetricsEndpoint() {
    return "stereum-" + this.id + ":6060";
  }

  buildPrometheusJob() {
    return `\n  - job_name: stereum-${
      this.id
    }\n    metrics_path: /debug/metrics/prometheus\n    static_configs:\n      - targets: [${this.buildExecutionClientMetricsEndpoint()}]`;
  }
}

// EOF
