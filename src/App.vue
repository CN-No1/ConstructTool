<template>
  <div>
    <layout></layout>
  </div>
</template>
<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import Layout from "./components/layout/Layout.vue";
@Component({
  components: { Layout }
})
export default class AppMain extends Vue {}
</script>

<style>
body {
  margin: 0;
}
</style>
