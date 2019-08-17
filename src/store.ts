import Vue from "vue";
import Vuex from "vuex";

import { VuexModule, Module, Mutation, Action } from "vuex-module-decorators";

Vue.use(Vuex);

@Module
class VuexStore extends VuexModule {
  public foo: number = 111;

  get axles() {
    return this.foo / 2;
  }

  @Action({ commit: "MutationMeth" })
  public ActionMeth() {
    return 8;
  }

  @Mutation
  public MutationMeth() {
    ++this.foo; // 改变 this.foo
  }
}

export default new Vuex.Store(VuexStore);
