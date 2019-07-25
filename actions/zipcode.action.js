const ESZipcode = require('../models/zipcode/zipcode.class');

const ESArea = require('../models/area/area.class');
const ESLine = require('../models/line/line.class');

const ESPoint = require('../models/point/point.class');

const redis = require('od-utility-redis');


class ESZipcodeAction {

    static async findAllZipcodeDetail(params, body, query) {
        try {

            const {record_list: zip_list, count, end} = await ESZipcode.findAllZipcodeDetail(query);


            const promise_list = zip_list.map(zipcode_info => this._findSingleZipcodeDetail(zipcode_info));


            const features = await Promise.all(promise_list);


            return {type: "FeatureCollection", features, count, end};

            //GET /api/v0/zipcode/all/detail?center_lat=37.6031556&center_lng=-122.0186382&zoom=0.05
            //    /api/v0/zipcode/all/detail?center_lat=37.6031556&center_lng=-112.0186382&zoom=0.05
        } catch (e) {
            throw e;
        }
    }

    static async findZipcodeDetail(params, body, query) {
        try {
            const {code} = params;

            const zipcode_info = await ESZipcode.findZipcodeWithCode(code);

            const feature = await this._findSingleZipcodeDetail(zipcode_info);

            return {feature};
        } catch (e) {
            throw e;
        }
    }

    static async _findSingleZipcodeDetail(zipcode_info) {
        try {
            const {zipcode_id, type, lat, lng, code} = zipcode_info;

            const response = await redis.getAsync('ES-ZIP', zipcode_id);
            if (response) return response;

            const {record_list: area_list} = await ESArea.findAreaList(zipcode_id);

            let coordinates = [];
            if (type === 'Polygon') {
                //HANDLE NORMAL 3
                coordinates = await this._findSinglePolygonDetail(zipcode_id, area_list)
            } else {
                coordinates = await this._findMultiPolygonDetail(zipcode_id, area_list);
            }


            const feature = {
                type: "Feature",
                properties: {INTPTLAT10: lat, INTPTLON10: lng, ZCTA5CE10: code},
                geometry: {type, coordinates}
            };


            await redis.setAsync('ES-ZIP', zipcode_id, feature, 365 * 24 * 60 * 60);


            // console.log(feature);

            return feature;

        } catch (e) {
            throw e;
        }
    }


    static async _findMultiPolygonDetail(zipcode_id, area_list) {
        try {
            const promise_list = area_list.map(area_info => {
                const {area_id} = area_info;
                return this._findSingleAreaDetail(zipcode_id, area_id);
            });

            const areas = await Promise.all(promise_list);

            // console.log(areas);
            return areas;

        } catch (e) {
            throw e;
        }
    }

    static async _findSinglePolygonDetail(zipcode_id, area_list) {
        try {
            const {area_id} = area_list[0];
            const area = await this._findSingleAreaDetail(zipcode_id, area_id);
            // console.log(area);
            return area;
        } catch (e) {
            throw e;
        }
    }

    static async _findSingleAreaDetail(zipcode_id, area_id) {
        try {
            const {record_list: line_list} = await ESLine.findLineListInArea(zipcode_id, area_id);

            const promise_list = line_list.map(info => {
                const {line_id} = info;
                return this._findSingleLineDetail(zipcode_id, area_id, line_id);
            });

            const lines = await Promise.all(promise_list);

            // console.log(lines);
            return lines;
        } catch (e) {
            throw e;
        }

    }

    static async _findSingleLineDetail(zipcode_id, area_id, line_id) {
        try {

            const {record_list: point_list, count, end: first_end} = await ESPoint.findPointListWithLine(
                line_id, area_id, zipcode_id, 0
            );


            let end = first_end;

            let result_list = point_list;
            // console.log('BEFORE WHILE', result_list.length);
            while (end < count) {

                const {record_list: next_list, end: next_end} = await ESPoint.findPointListWithLine(
                    line_id, area_id, zipcode_id, end
                );

                result_list = result_list.concat(next_list);

                end = next_end;
            }


            // console.log(point_list);
            // console.log(point_list.length);
            // console.log('AFTER WHILE', result_list.length);
            return result_list;
        } catch (e) {
            throw e;
        }
    }


}

module.exports = ESZipcodeAction;