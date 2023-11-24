import PluginAddon from "..";
import { kMeansClustering } from "../structures/kmeans";
import { AO_Unit } from "./unit-helpers";

const _a3 = new THREE.Vector3(), _b3 = new THREE.Vector3();
const _result = {
    centroids: {
        a: _a3,
        b: _b3
    },
    clusters: {
        a: [] as AO_Unit[],
        b: [] as AO_Unit[]
    }
}

const isVectorNaN = (v: THREE.Vector3) => {
    return isNaN(v.x) || isNaN(v.y) || isNaN(v.z);
}

export const getClusters = (plugin: PluginAddon, units: AO_Unit[]) => {

    const result = kMeansClustering(units, 2, 10);
    plugin.pxToWorld.xyz(result.centroids[0].x, result.centroids[0].y, _a3)
    plugin.pxToWorld.xyz(result.centroids[0].x, result.centroids[0].y, _b3)

    if (isVectorNaN(_b3)) {
        _b3.copy(_a3);
    }

    _result.clusters.a = result.clusters[0];
    _result.clusters.b = result.clusters[1];

    return _result;
}

export const getUnitsNearCluster = (plugin: PluginAddon, units: AO_Unit[], cluster: THREE.Vector3, radius: number) => {

    const unitsNearCluster = units.filter(unit => {
        plugin.pxToWorld.xyz(unit.x, unit.y, _a3);
        return _a3.distanceTo(cluster) < radius;
    });

    return unitsNearCluster;
}

export const unitScoreReducer = (acc: number, unit: AO_Unit) => {
    return acc + unit.extras.ao_score;
};

export const getScoreUnitsNearCluster = (plugin: PluginAddon, units: AO_Unit[], cluster: THREE.Vector3, radius: number) => {
    const unitsNearCluster = getUnitsNearCluster(plugin, units, cluster, radius);
    return unitsNearCluster.reduce(unitScoreReducer, 0);
}