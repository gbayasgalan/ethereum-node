<template>
  <div class="dataApi-parent">
    <div class="dataApi-box">
      <node-connection-row row-name="DATA-API"></node-connection-row>
      <div
        class="dataApi-data"
        v-for="item in dataApiItems"
        :key="item.id"
        ref="clone"
        @click="copy(item.value)"
      >
        <span>{{ item.title }}</span>
      </div>
    </div>
    <div class="compTtl">
      <span>{{ copyVal }}</span>
    </div>
  </div>
</template>
<script>
import NodeConnectionRow from "./NodeConnectionRow.vue";
export default {
  components: { NodeConnectionRow },
  data() {
    return {
      copyVal: "click to copy",
      dataApiItems: [
        {
          id: 1,
          title: "TEKU",
          value: "11111",
        },
        {
          id: 2,
          title: "LIGHTHOUSE",
          value: "22222",
        },
      ],
    };
  },

  methods: {
    async copy(s) {
      await navigator.clipboard.writeText(s);
      this.copyVal = "copied";
    },
  },
};
</script>
<style scoped>
.dataApi-parent {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  border: 1px solid #343434;
  background: rgb(42, 42, 42);
  box-sizing: border-box;
  width: 38%;
  height: 95%;
  border-radius: 10px;
  flex-direction: column;
}

.dataApi-box {
  width: 100%;
  height: 75%;
  display: flex;
  flex-direction: column;
}
.compTtl {
  display: flex;
  width: 100%;
  height: 20%;
  font-size: 50%;
  justify-content: center;
  align-items: center;
}
.dataApi-data {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 98%;
  height: 27%;
  margin: 2% 0;
  padding: 2%;
  font-size: 55%;
  border: 1px solid #707070;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 600;
}
</style>