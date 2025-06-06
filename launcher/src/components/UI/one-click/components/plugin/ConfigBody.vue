<template>
  <div class="w-full h-full col-start-1 col-span-full row-start-3 row-end-11 grid grid-cols-12 grid-rows-7 p-2 mx-auto">
    <div
      class="w-full h-full col-start-3 col-end-11 row-start-1 row-span-full bg-[#1E2429] rounded-md grid grid-cols-12 grid-rows-7 p-4 gap-1"
    >
      <div class="col-start-1 col-span-full row-start-1 row-span-1 grid grid-cols-2 gap-1">
        <div class="w-full h-10 col-start-1 col-span-1 flex justify-center items-center">
          <div class="w-full h-8 border border-gray-600 rounded-md p-1 flex justify-center items-center">
            <span class="text-center text-gray-400 text-md font-normal">{{ $t("oneClick.installedService") }}</span>
          </div>
        </div>
        <div class="w-full h-10 col-start-2 col-span-1 flex justify-center items-center relative">
          <div class="w-full h-8 border border-gray-600 rounded-md p-1 flex flex-col justify-between items-center">
            <span class="text-center text-gray-400 text-md font-normal">{{ $t("oneClick.addOption") }}</span>
          </div>
        </div>
      </div>

      <PluginRows :filtered-plugin="filteredPluginsOnCategory" @change-handler="pluginChangeHandler" @plugin-exchange="pluginExChange" />

      <InstallationPath />
    </div>
  </div>
</template>
<script setup>
import PluginRows from "./PluginRows.vue";
import InstallationPath from "./InstallationPath.vue";
import { useClickInstall } from "@/store/clickInstallation";
import ControlService from "@/store/ControlService";
import { useServices } from "@/store/services";
import { useNodeManage } from "@/store/nodeManage";
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";

const filteredPluginsOnCategory = ref([]);

const router = useRouter();

const manageStore = useNodeManage();
const clickStore = useClickInstall();
const serviceStore = useServices();

//Computed & Watchers

watch(
  () => clickStore.installMonitoring,
  () => {
    filterMonitoringServices();
  }
);

//Lifecycle Hooks

onMounted(() => {
  clickStore.selectedPreset.includedPlugins = clickStore.selectedPreset?.includedPlugins.map((item) => {
    return {
      ...item,
      openReplaceModal: false,
    };
  });
});
onMounted(() => {
  getInstallPath();
  sortPlugins();
  selectedPluginsValidation();
  clickStore.installMonitoring = false;
});

const updatePlugins = () => {
  if (clickStore.selectedPreset.name === "op node archive" || clickStore.selectedPreset.name === "op and eth node archive") {
    const OpRethExists = clickStore.selectedPreset.includedPlugins.some((item) => item.service === "OpRethService");
    const L2GethExists = clickStore.selectedPreset.includedPlugins.some((item) => item.service === "L2GethService");
    if (OpRethExists && L2GethExists) {
      clickStore.selectedPreset.includedPlugins = clickStore.selectedPreset.includedPlugins.filter(
        (item) => item.service !== "L2GethService"
      );
    } else if (!OpRethExists && !L2GethExists) {
      clickStore.selectedPreset.includedPlugins = clickStore.selectedPreset.includedPlugins.concat(
        serviceStore.allServices.filter((s) => s.service === "L2GethService")
      );
    }

    return clickStore.selectedPreset.includedPlugins;
  }
};

//Methods
const filterMonitoringServices = () => {
  if (clickStore.installMonitoring) {
    clickStore.selectedPreset.includedPlugins = clickStore.selectedPreset?.includedPlugins.concat(
      serviceStore.allServices.filter((s) =>
        ["GrafanaService", "PrometheusNodeExporterService", "PrometheusService", "MetricsExporterService"].includes(s.service)
      )
    );
  } else {
    clickStore.selectedPreset.includedPlugins = clickStore.selectedPreset?.includedPlugins.filter(
      (s) => !["GrafanaService", "PrometheusNodeExporterService", "PrometheusService", "MetricsExporterService"].includes(s.service)
    );
  }
};

const selectedPluginsValidation = () => {
  if (Object.keys(clickStore.selectedPreset?.includedPlugins).length === 0) {
    router.push("/oneClick/preset");
  }
};
const pluginChangeHandler = (plugin, item, idx) => {
  plugin.openReplaceModal = false;
  const oldPluginIndex = clickStore.selectedPreset?.includedPlugins.findIndex((e) => e.id === plugin?.id);

  if (oldPluginIndex !== -1) {
    clickStore.selectedPreset?.includedPlugins.splice(oldPluginIndex, 1);
  }

  clickStore.selectedPreset?.includedPlugins.splice(idx, 0, item);

  if (
    ["staking", "mev boost", "stereum on arm", "archive", "lidocsm", "op and eth full node", "op and eth node archive"].includes(
      clickStore.selectedPreset.name
    )
  ) {
    if (item.category === "consensus" && getCorrespondingValidator(item.name)) {
      let valIndex = clickStore.selectedPreset.includedPlugins.findIndex((e) => e.category === "validator");
      clickStore.selectedPreset.includedPlugins[valIndex] = getCorrespondingValidator(item.name);
    } else if (
      item.category === "validator" &&
      getCorrespondingConsensus(item.name) &&
      !clickStore.selectedPreset.includedPlugins.some((e) => e.name === "Grandine")
    ) {
      let conIndex = clickStore.selectedPreset.includedPlugins.findIndex((e) => e.category === "consensus");
      clickStore.selectedPreset.includedPlugins[conIndex] = getCorrespondingConsensus(item.name);
    }
  }
  updatePlugins();
  sortPlugins();
};

const getCorrespondingValidator = (serviceName) => {
  return serviceStore.allServices.find((e) => e.service === serviceName + "ValidatorService");
};

const getCorrespondingConsensus = (serviceName) => {
  return serviceStore.allServices.find((e) => e.service === serviceName + "BeaconService");
};

const sortPlugins = () => {
  if (clickStore.selectedPreset.includedPlugins) {
    const ec = clickStore.selectedPreset.includedPlugins.filter((p) => p.category === "execution");
    const cc = clickStore.selectedPreset.includedPlugins.filter((p) => p.category === "consensus");
    const vc = clickStore.selectedPreset.includedPlugins.filter((p) => p.category === "validator");
    const services = clickStore.selectedPreset.includedPlugins.filter((p) => p.category === "service");
    clickStore.selectedPreset.includedPlugins = new Array().concat(ec, cc, vc, services);
  }
};

const pluginExChange = (el) => {
  if (el.category !== "service") {
    clickStore.selectedPreset.includedPlugins.filter((item) => {
      item.openReplaceModal = false;
      if (item.service === el.service) {
        checkPluginCategory(item);
      }
    });

    el.openReplaceModal = true;
  }
};

const checkPluginCategory = (element) => {
  let filter;
  switch (clickStore.selectedPreset.name) {
    case "lidocsm":
    case "mev boost":
    case "staking":
      filter = (item) =>
        item.category === element.category && !/(SSVNetwork|Web3Signer|Charon|L2Geth|OpGeth|OpNode|OpReth|OpErigon)/.test(item.service);
      if (manageStore.currentNetwork.network == "gnosis") {
        filter = (item) =>
          item.category === element.category &&
          /(Lighthouse|Teku|Nethermind|Erigon|Nimbus|Lodestar)/.test(item.service) &&
          !/(OpGeth|OpErigon|OpNode|OpReth|L2Geth)/.test(item.service);
      }
      break;
    case "ssv.network":
    case "lidossv":
      filter = (item) => {
        if (element.category === "validator") {
          return item.service === "SSVNetworkService";
        } else if (element.category === "consensus" && item.category === "consensus") {
          return item.category === element.category && !/(OpNode)/.test(item.service);
        } else if (element.category === "execution" && item.category === "execution") {
          return item.category === element.category && !/(L2Geth|OpGeth|OpNode|OpReth|OpErigon)/.test(item.service);
        }
        return false;
      };
      break;
    case "obol":
    case "lidoobol":
      filter = (item) => {
        if (element.category === "execution" && element.service !== "CharonService") {
          return item.category === element.category && !/(L2Geth|OpGeth|OpNode|OpReth|OpErigon)/.test(item.service);
        } else if (element.category === "validator" && element.service !== "CharonService") {
          return item.category === element.category && !/(SSVNetwork|Web3Signer|Charon)/.test(item.service);
        } else if (element.category === "validator" && element.service === "CharonService") {
          return item.service === "CharonService";
        } else {
          return item.category === element.category && !/(OpNode)/.test(item.service);
        }
      };
      break;
    case "rocketpool":
      //filter = (item) => item.category === element.category
      break;
    case "stereum on arm":
      filter = (item) =>
        item.category === element.category &&
        !/(Prysm|Reth|SSVNetwork|Web3Signer|Charon|L2Geth|OpGeth|OpNode|OpReth|OpErigon)/.test(item.service);
      if (manageStore.currentNetwork.network == "gnosis") {
        filter = (item) => item.category === element.category && /(Lighthouse|Teku|Nethermind)/.test(item.service);
      }
      break;
    case "archive":
      filter = (item) =>
        item.category === element.category && !/(SSVNetwork|Web3Signer|Charon|L2Geth|OpGeth|OpNode|OpReth|OpErigon)/.test(item.service);
      if (manageStore.currentNetwork.network == "gnosis") {
        filter = (item) =>
          item.category === element.category &&
          /(Lighthouse|Teku|Nethermind|Erigon|Nimbus|Lodestar)/.test(item.service) &&
          !/(OpGeth|OpErigon|OpNode|OpReth|L2Geth)/.test(item.service);
      }
      break;

    case "op full node":
      filter = (item) => {
        if (manageStore.currentNetwork.network == "op-mainnet") {
          return item.category === element.category && /(OpGethService|OpErigonService)/.test(item.service);
        } else if (element.service === "OpGethService" || element.service === "OpErigonService" || element.service === "OpRethService") {
          return item.category === element.category && /(OpGethService|OpErigonService|OpRethService)/.test(item.service);
        } else if (element.service === "L2GethService") {
          return item.category === element.category && /L2GethService/.test(item.service);
        }

        if (element.category === "consensus" && element.service === "OpNodeBeaconService") {
          return item.category === element.category && /(OpNode)/.test(item.service);
        }
        return (
          item.category === element.category && item.service === element.service && /OpGethService|OpNodeBeaconService/.test(item.service)
        );
      };
      break;

    case "op and eth full node":
      filter = (item) => {
        if (element.category === "execution") {
          if (/Op(Geth|Erigon|Reth)Service/.test(element.service)) {
            return item.category === "execution" && /(OpGethService|OpErigonService)/.test(item.service);
          }
          if (manageStore.currentNetwork.network == "op-mainnet" && /Op(Geth|Erigon|Reth)Service/.test(element.service)) {
            return item.category === "execution" && /(OpGethService|OpErigonService)/.test(item.service);
          }

          if (element.service === "L2GethService") {
            return item.category === "execution" && item.service === "L2GethService";
          }

          return item.category === "execution" && !/(SSVNetwork|Web3Signer|Charon|L2Geth|OpGeth|OpNode|OpReth|OpErigon)/.test(item.service);
        }

        if (element.category === "consensus" && element.service === "OpNodeBeaconService") {
          return item.category === element.category && /(OpNode)/.test(item.service);
        }

        return (
          item.category === element.category && !/(SSVNetwork|Web3Signer|Charon|L2Geth|OpGeth|OpNode|OpReth|OpErigon)/.test(item.service)
        );
      };
      break;

    case "op node archive":
      filter = (item) => {
        if (element.category === "execution") {
          if (/Op(Geth|Erigon|Reth)Service/.test(element.service)) {
            return item.category === "execution" && /(OpGethService|OpErigonService|OpRethService)/.test(item.service);
          }

          if (element.service === "L2GethService") {
            return item.category === "execution" && item.service === "L2GethService";
          }

          return item.category === "execution" && !/(SSVNetwork|Web3Signer|Charon|L2Geth|OpGeth|OpNode|OpReth|OpErigon)/.test(item.service);
        }
        if (element.category === "consensus" && element.service === "OpNodeBeaconService") {
          return item.category === element.category && /(OpNode)/.test(item.service);
        }

        return false;
      };
      break;

    case "op and eth node archive":
      filter = (item) => {
        if (element.category === "execution") {
          if (/Op(Geth|Erigon|Reth)Service/.test(element.service)) {
            return item.category === "execution" && /(OpGethService|OpErigonService|OpRethService)/.test(item.service);
          }

          if (element.service === "L2GethService") {
            return item.category === "execution" && item.service === "L2GethService";
          }

          return item.category === "execution" && !/(SSVNetwork|Web3Signer|Charon|L2Geth|OpGeth|OpNode|OpReth|OpErigon)/.test(item.service);
        }

        if (element.category === "consensus" && element.service === "OpNodeBeaconService") {
          return item.category === element.category && /(OpNode)/.test(item.service);
        }

        return (
          item.category === element.category && !/(SSVNetwork|Web3Signer|Charon|L2Geth|OpGeth|OpNode|OpReth|OpErigon)/.test(item.service)
        );
      };
      break;

    default:
      break;
  }

  filteredPluginsOnCategory.value = serviceStore.allServices.filter(filter);
};

const getInstallPath = async () => {
  let largestVolumePath = await ControlService.getLargestVolumePath();
  if (largestVolumePath === "/") largestVolumePath = largestVolumePath + "opt";
  const stereumInstallationPath = [largestVolumePath, "/stereum"].join("/").replace(/\/{2,}/, "/");
  clickStore.installationPath = stereumInstallationPath;
};
</script>
<style scoped>
.slide-fade-enter-active {
  transition: all 0.2s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-20px);
}
</style>
