import type { CharacteristicValue, PlatformAccessory, Service } from 'homebridge';

import type { AdvancedSwitches } from '../platform.js';
import type { DeviceConfig } from '../deviceConfig.js'; 

/**
 * Stateful Switch
 * 
 * A basic stateful switch for use in conditional automations.
 * Once turned set on or off, it will remain in that state until changed.
 */
export class StatefulSwitch {
  private config: DeviceConfig;
  private onService: Service;

  constructor(
    private readonly platform: AdvancedSwitches,
    private readonly accessory: PlatformAccessory,
  ) {
    this.config = accessory.context.config as DeviceConfig;

    // Set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Name, this.config.name)
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Advanced Switches')
      .setCharacteristic(this.platform.Characteristic.Model, 'Stateful Switch')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, '12345678');

    // Get the ON service if it exists or create a new one if it doesn't
    this.onService = this.accessory.getService(this.platform.Service.Switch) || this.accessory.addService(this.platform.Service.Switch);

    // Set the current 'on' value to whatever is stored, or false there isn't existing state.
    this.onService.updateCharacteristic(this.platform.Characteristic.On, accessory.context.isOn as boolean);

    // Register a setter/getter for the 'on' characteristic
    this.onService.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this));
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  async setOn(value: CharacteristicValue) {
    this.accessory.context.isOn = value as boolean;
    this.platform.api.updatePlatformAccessories([this.accessory]);
    this.onService.updateCharacteristic(this.platform.Characteristic.On, value as boolean);
    this.platform.log.debug('Set Characteristic On ->', value);
  }
}
