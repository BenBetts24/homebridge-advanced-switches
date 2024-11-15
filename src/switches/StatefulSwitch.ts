import type { CharacteristicValue, PlatformAccessory } from 'homebridge';

import type { AdvancedSwitches } from '../platform.js';
import { BaseSwitch } from './BaseSwitch.js';

/**
 * Stateful Switch
 * 
 * A basic stateful switch for use in conditional automations.
 * Once turned set on or off, it will remain in that state until changed.
 */
export class StatefulSwitch extends BaseSwitch {
  constructor(
    platform: AdvancedSwitches,
    accessory: PlatformAccessory,
  ) {
    super(platform, accessory);
    this.setupSwitchService();
  }

  private setupSwitchService() {
    // Set the current 'On' value to whatever is stored, or false if there isn't existing state.
    this.updateOn(this.accessory.context.isOn);

    // Register a setter/getter for the 'On' characteristic
    this.onCharacteristic
      .onSet(this.setOn.bind(this));
  }

  private async setOn(value: CharacteristicValue) {
    this.accessory.context.isOn = value as boolean;
    this.platform.api.updatePlatformAccessories([this.accessory]);
    this.updateOn(value as boolean);
    this.platform.log.debug('Set Characteristic On ->', value);
  }
}
