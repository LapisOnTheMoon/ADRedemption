Vue.component('laitela-tab', {
  data: function() {
    return {
      matter: 0,
      nextUnlock: "",
      matterEffectPercentage: ""
    };
  },
  methods: {
    update() {
      this.matter = player.celestials.laitela.matter
      this.nextUnlock = Laitela.nextMatterDimensionThreshold
      this.matterEffectPercentage = Laitela.matterEffectPercentage
    },
    startRun() {
      Laitela.startRun()
    },
    buyUnlock(info) {
      Laitela.buyUnlock(info)
    },
    hasUnlock(info) {
      return Laitela.has(info)
    },
    canBuyUnlock(info) {
      return Laitela.canBuyUnlock(info)
    },
    unlockClassObject(info) {
      return {
        'o-laitela-shop-button-bought': this.hasUnlock(info), 
        'o-laitela-shop-button-available': this.canBuyUnlock(info)
      }
    }
  },
  computed: {
    dimensions() {
      return Array.range(1, 4).map(tier => MatterDimension(tier))
    },
    runUnlockThresholds() {
      return laitelaRunUnlockThresholds
    },
    unlocksInfo() {
      return LAITELA_UNLOCKS
    }
  },
  template:
    `<div class="l-laitela-celestial-tab">
      <button class="o-laitela-run-button" @click="startRun">Start a new reality, only the first dimension of all types produce anything. You will unlock more matter dimensions at specific thresholds</button>
      <div class="o-laitela-matter-amount">You have {{ shorten(matter, 2, 0) }} Matter</div>
      <div>Matter causes your dimension cost multipliers to raise {{ matterEffectPercentage }} slower</div>
      <div v-for="(dimension, i) in dimensions" :key="i">
        <matter-dimension-row
        v-if="dimension.amount !== 0"
        :key="i"
        :dimension="dimension"
        />
      </div>
      <div>{{ nextUnlock }}</div>
      <div class="l-laitela-unlocks-container">
        <button 
          v-for="unlock in unlocksInfo" 
          :key="unlock.id" 
          class="o-laitela-shop-button"
          :class="unlockClassObject(unlock)"
          @click="buyUnlock(unlock)"> {{ unlock.description }} <br> Costs: {{ shorten(unlock.price) }} <span v-if="unlock.value"><br/>Currently: {{ unlock.format(unlock.value()) }}</span></button>
      </div>
    </div>`
});