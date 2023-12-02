import { ConfigSchema2_0_6 } from "../types/config-2.0.6";
import { ConfigSchema2_1_0 } from "../types/config-2.1.0";

export const fromVersion = "2.0.6";
export const toVersion = "2.1.0";

export const migrate = (config: ConfigSchema2_0_6, newConfig: ConfigSchema2_1_0): ConfigSchema2_1_0 => {

    return {
        ...newConfig,
        ...config,
    }

}