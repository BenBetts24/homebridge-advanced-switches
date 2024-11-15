import type { Characteristic, PlatformAccessory, Service } from 'homebridge';

import type { AdvancedSwitches } from '../platform.js';
import type { DeviceConfig } from '../DeviceConfig.js'; 

/**
 * Base Switch
 * 
 * The base switch that all other switches inherit from.
 * Does basic setup required for all switches.
 */
export class BaseSwitch {
  protected config: DeviceConfig;
  protected switchService: Service;
  protected onCharacteristic: Characteristic;

  constructor(
    protected readonly platform: AdvancedSwitches,
    protected readonly accessory: PlatformAccessory,
  ) {
    this.config = accessory.context.config as DeviceConfig;

    // Set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Name, this.config.name)
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Advanced Switches')
      .setCharacteristic(this.platform.Characteristic.Model, this.modelName(this.config.type))
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.accessory.UUID);

    this.switchService = this.accessory.getService(this.platform.Service.Switch) ||
      this.accessory.addService(this.platform.Service.Switch);
    this.onCharacteristic = this.switchService.getCharacteristic(this.platform.Characteristic.On);
  }

  protected updateOn(value: boolean) {
    this.onCharacteristic.updateValue(value);
  }

  // Private Helpers

  // Takes a camelcase type name and inserts spaces where expected.
  // Thanks JosephGarrone https://stackoverflow.com/a/34323600.
  private modelName(type: string) : string {
    let name = type.replace(/([a-z])([A-Z])/g, '$1 $2');
    name = name.replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
    return name;
  }
}
