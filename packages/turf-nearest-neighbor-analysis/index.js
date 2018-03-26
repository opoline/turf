"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
var area_1 = __importDefault(require("@turf/area"));
var bbox_1 = __importDefault(require("@turf/bbox"));
var bbox_polygon_1 = __importDefault(require("@turf/bbox-polygon"));
var centroid_1 = __importDefault(require("@turf/centroid"));
var distance_1 = __importDefault(require("@turf/distance"));
var nearest_point_1 = __importDefault(require("@turf/nearest-point"));
var meta_1 = require("@turf/meta");
var helpers_1 = require("@turf/helpers");
/**
 * Nearest Neighbor Analysis calculates an index based the average distances
 * between points in the dataset, thereby providing inference as to whether the
 * data is clustered, dispersed, or randomly distributed within the study area.
 *
 * It returns a {@link Feature<Polygon>} of the study area, with the results of
 * the analysis attached as part of of the `nearestNeighborAnalysis` property
 * of the study area's `properties`. The attached
 * [_z_-score](https://en.wikipedia.org/wiki/Standard_score) indicates how many
 * standard deviations above or below the expected mean distance the data's
 * observed mean distance is. The more negative, the more clustered. The more
 * positive, the more evenly dispersed. A _z_-score between -2 and 2 indicates
 * a seemingly random distribution. That is, within _p_ of less than 0.05, the
 * distribution appears statistically significantly neither clustered nor
 * dispersed.
 *
 * **Remarks**
 *
 * - Though the analysis will work on any {@link FeatureCollection} type, it
 * works best with {@link Point} collections.
 *
 * - This analysis is _very_ sensitive to the study area provided. If no {@link Feature<Polygon>} is passed as the study area, the function draws a box
 * around the data, which may distort the findings. This analysis works best
 * with a bounded area of interest within with the data is either clustered,
 * dispersed, or randomly distributed. For example, a city's subway stops may
 * look extremely clustered if the study area is an entire state. On the other
 * hand, they may look rather evenly dispersed if the study area is limited to
 * the city's downtown.
 *
 * **Bibliography**
 *
 * Philip J. Clark and Francis C. Evans, “Distance to Nearest Neighbor as a
 * Measure of Spatial Relationships in Populations,” _Ecology_ 35, no. 4
 * (1954): 445–453, doi:[10.2307/1931034](http://doi.org/10.2307/1931034).
 *
 * @name nearestNeighborAnalysis
 * @param {FeatureCollection<any>} dataset FeatureCollection (pref. of points) to study
 * @param {Object} [options={}] Optional parameters
 * @param {Feature<Polygon>} [options.studyArea] polygon representing the study area
 * @param {string} [options.units='kilometers'] unit of measurement for distances and, squared, area.
 * @param {Object} [options.properties={}] properties
 * @returns {Feature<Polygon>} A polygon of the study area or an approximation of one.
 * @example
 * var bbox = [-65, 40, -63, 42];
 * var dataset = turf.randomPoint(100, { bbox: bbox });
 * var nearestNeighborStudyArea = turf.nearestNeighborAnalysis(dataset);
 *
 * //addToMap
 * var addToMap = [dataset, nearestNeighborStudyArea];
 */
function nearestNeighborAnalysis(dataset, options) {
    // Optional params
    options = options || {};
    var studyArea = options.studyArea || bbox_polygon_1.default(bbox_1.default(dataset));
    var properties = options.properties || {};
    var units = options.units || 'kilometers';
    var features = [];
    meta_1.featureEach(dataset, function (feature) {
        features.push(centroid_1.default(feature));
    });
    var n = features.length;
    var observedMeanDistance = features.map(function (feature, index) {
        var otherFeatures = helpers_1.featureCollection(features.filter(function (f, i) {
            return i !== index;
        }));
        return distance_1.default(feature, nearest_point_1.default(feature, otherFeatures), { units: units });
    }).reduce(function (sum, value) { return sum + value; }, 0) / n;
    var populationDensity = n / helpers_1.convertArea(area_1.default(studyArea), 'meters', units);
    var expectedMeanDistance = 1 / (2 * Math.sqrt(populationDensity));
    var variance = 0.26136 / (Math.sqrt(n * populationDensity));
    properties.nearestNeighborAnalysis = {
        units: units,
        arealUnits: units + '²',
        observedMeanDistance: observedMeanDistance,
        expectedMeanDistance: expectedMeanDistance,
        nearestNeighborIndex: observedMeanDistance / expectedMeanDistance,
        numberOfPoints: n,
        zScore: (observedMeanDistance - expectedMeanDistance) / variance
    };
    studyArea.properties = properties;
    return studyArea;
}
exports.default = nearestNeighborAnalysis;
