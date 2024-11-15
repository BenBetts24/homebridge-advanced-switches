import {
  Categories,
  type API,
  type Characteristic,
  type DynamicPlatformPlugin,
  type Logging,
  type PlatformAccessory,
  type PlatformConfig,
  type Service,
} from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';
import type { DeviceConfig } from './DeviceConfig.js';

import { StatefulSwitch } from './switches/StatefulSwitch.js';

const CLASS_DEF = {
  statefulswitch: StatefulSwitch,
};

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class AdvancedSwitches implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: Map<string, PlatformAccessory> = new Map();
  public readonly configUUIDs: string[] = [];

  constructor(
    public readonly log: Logging,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.Service = api.hap.Service;
    this.Characteristic = api.hap.Characteristic;

    if (!this.config || !this.config.devices) {
      this.log.error('No devices found. Check that you have specified them in your config.json file');
    }

    if (this.config && this.config.devices) {
      for (const device of this.config.devices) {
        this.configUUIDs.push(this.generateUUID(device.name));
      }
    }

    this.api.on('didFinishLaunching', () => {
      this.removeUnexpectedAccessories();
      this.makeDevices();
    });
  }

  configureAccessory(accessory: PlatformAccessory) {
    // Add any homebridge cached accessories to the list of accessories
    this.accessories.set(accessory.UUID, accessory);
  }

  removeUnexpectedAccessories() {
    // Remove any accessories that aren't defined in the config.
    for (const [uuid, cachedAccessory] of this.accessories) {
      if (!this.configUUIDs.includes(uuid)) {
        this.removeAccessory(cachedAccessory);
      }
    }
  }

  makeDevices() {
    if (!this.config.devices) {
      return;
    }

    for (const deviceConfig of this.config.devices as [DeviceConfig]) {
      const type = deviceConfig.type.toLowerCase() as keyof typeof CLASS_DEF;
      if (!type) {
        this.log.error('%s doesn\'t have a type defined', deviceConfig.name);
        continue;
      }

      const Accessory = CLASS_DEF[type];
      const uuid = this.generateUUID(deviceConfig.name);
      let accessory = this.accessories.get(uuid);
      const cachedConfig = accessory?.context.config as DeviceConfig;

      if (accessory && cachedConfig && cachedConfig.type !== deviceConfig.type) {
        this.log.info('%s has a different type than configured. Recreating from scratch.', accessory.displayName);
        this.removeAccessory(accessory);
        accessory = undefined;
      }

      if (!accessory) {
        accessory = new this.api.platformAccessory(deviceConfig.name, uuid, Categories.SWITCH);
        this.registerAccessory(accessory);
      }

      if (accessory.displayName !== deviceConfig.name) {
        accessory.displayName = deviceConfig.name;
      }

      accessory.context.config = deviceConfig;
      new Accessory(this, accessory);
    }

    this.api.updatePlatformAccessories([...this.accessories.values()]);
  }

  registerAccessory(accessory: PlatformAccessory) {
    this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    this.accessories.set(accessory.UUID, accessory);
  }
  
  removeAccessory(accessory: PlatformAccessory) {
    this.accessories.delete(accessory.UUID);
    this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
  }
  
  generateUUID(name: string) {
    // TODO: Come up with more unique way to generate UUID. Maybe combine properties?
    // - Currently, if two switches have the same name and type, they'll collide.
    return this.api.hap.uuid.generate(PLUGIN_NAME + name);
  }
}