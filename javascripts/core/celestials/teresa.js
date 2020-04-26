"use strict";

const TERESA_UNLOCKS = {
  RUN: {
    id: 0,
    price: 1e14,
    description: "unlock Teresa's reality.",
  },
  EPGEN: {
    id: 1,
    price: 1e18,
    description: "unlock Teresa's EP generation.",
  },
  EFFARIG: {
    id: 2,
    price: 1e21,
    description: "unlock Effarig, Celestial of Ancient Relics.",
  },
  SHOP: {
    id: 3,
    price: 1e24,
    description: "unlock Perk Point Shop.",
  },
  UNDO: {
    id: 4,
    price: 1e10,
    description: 'unlock "Undo" of equipping a glyph.',
  }
};

const Teresa = {
  timePoured: 0,
  unlockInfo: TERESA_UNLOCKS,
  lastUnlock: "SHOP",
  rmStoreMax: 1e24,
  displayName: "Teresa",
  pourRM(diff) {
    if (this.rmStore >= Teresa.rmStoreMax) return;
    this.timePoured += diff;
    const rm = player.reality.realityMachines;
    const rmPoured = Math.min((this.rmStore + 1e6) * 0.01 * Math.pow(this.timePoured, 2), rm.toNumber());
    this.rmStore += Math.min(rmPoured, Teresa.rmStoreMax - this.rmStore);
    player.reality.realityMachines = rm.minus(rmPoured);
    this.checkForUnlocks();
  },
  checkForUnlocks() {
    for (const info of Object.values(Teresa.unlockInfo)) {
      if (!this.has(info) && this.rmStore >= info.price) {
        // eslint-disable-next-line no-bitwise
        player.celestials.teresa.unlockBits |= (1 << info.id);
        EventHub.dispatch(GAME_EVENT.CELESTIAL_UPGRADE_UNLOCKED, this, info);
      }
    }
  },
  has(info) {
    if (!info.hasOwnProperty("id")) throw "Pass in the whole TERESA UNLOCK object";
    // eslint-disable-next-line no-bitwise
    return Boolean(player.celestials.teresa.unlockBits & (1 << info.id));
  },
  initializeRun() {
    clearCelestialRuns();
    player.celestials.teresa.run = true;
  },
  rewardMultiplier(antimatter) {
    return Decimal.max(Decimal.pow(antimatter.plus(1).log10() / 1.5e8, 12), 1).toNumber();
  },
  get rmStore() {
    return player.celestials.teresa.rmStore;
  },
  set rmStore(amount) {
    player.celestials.teresa.rmStore = amount;
  },
  get fill() {
    return Math.min(Math.log10(this.rmStore) / 24, 1);
  },
  get rmMultiplier() {
    return Math.max(Math.pow(this.rmStore, 0.1), 1);
  },
  get runRewardMultiplier() {
    return this.rewardMultiplier(player.celestials.teresa.bestRunAM);
  },
  get isRunning() {
    return player.celestials.teresa.run;
  },
  get runCompleted() {
    return player.celestials.teresa.bestRunAM.gt(0);
  },
  quotes: new CelestialQuotes("teresa", {
    INITIAL: {
      id: 1,
      lines: [
        "We've been observing you",
        "You have shown promise with your bending of the reality",
        "We are the Celestials, and we want you to join us.",
        "My name is Teresa, the Celestial Of Reality",
        "Prove your worth.",
      ]
    },
    UNLOCK_REALITY: CelestialQuotes.singleLine(
      2, "I'll let you inside my Reality, mortal. Don't get crushed by it."
    ),
    COMPLETE_REALITY: CelestialQuotes.singleLine(
      3, "Why are you still here... You were supposed to fail"
    ),
    EFFARIG: {
      id: 4,
      lines: [
        "You are still no match for us.",
        "I hope the others succeed where I have failed."
      ]
    }
  }),
};

class PerkShopUpgradeState extends RebuyableMechanicState {
  constructor(config) {
    super(config);
    this.costCap = config.costCap;
  }
  
  get currency() {
    return Currency.perkPoints;
  }

  get boughtAmount() {
    return player.celestials.teresa.perkShop[this.id];
  }

  set boughtAmount(value) {
    player.celestials.teresa.perkShop[this.id] = value;
  }

  get isCapped() {
    return this.cost === this.costCap(this.bought);
  }

  get isAvailableForPurchase() {
    return this.cost < this.currency.value;
  }

  purchase() {
    if (!super.purchase()) return;
    if (this.id === 1) {
      Autobuyer.reality.bumpAmount(2);
    }
    if (this.id === 4) {
      Glyphs.addToInventory(GlyphGenerator.musicGlyph());
      GameUI.notify.success("Created a music glyph");
    }
  }
}

const PerkShopUpgrade = (function() {
  const db = GameDatabase.celestials.perkShop;
  return {
    glyphLevel: new PerkShopUpgradeState(db.glyphLevel),
    rmMult: new PerkShopUpgradeState(db.rmMult),
    bulkDilation: new PerkShopUpgradeState(db.bulkDilation),
    autoSpeed: new PerkShopUpgradeState(db.autoSpeed),
    musicGlyph: new PerkShopUpgradeState(db.musicGlyph),
  };
}());

EventHub.logic.on(GAME_EVENT.TAB_CHANGED, () => {
  if (Tab.celestials.teresa.isOpen) Teresa.quotes.show(Teresa.quotes.INITIAL);
});

EventHub.logic.on(GAME_EVENT.CELESTIAL_UPGRADE_UNLOCKED, ([celestial, upgradeInfo]) => {
  if (celestial === Teresa) {
    if (upgradeInfo === TERESA_UNLOCKS.RUN) Teresa.quotes.show(Teresa.quotes.UNLOCK_REALITY);
    if (upgradeInfo === TERESA_UNLOCKS.EFFARIG) Teresa.quotes.show(Teresa.quotes.EFFARIG);
  }
});

EventHub.logic.on(GAME_EVENT.GAME_LOAD, () => Teresa.checkForUnlocks());
