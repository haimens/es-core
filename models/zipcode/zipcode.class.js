const ODInstance = require('../instance.model');
const ODCondition = require('../condition.model');


const func = require('od-utility');


class VNZipcode extends ODInstance {

    constructor(zipcode_token, zipcode_id) {
        super('es_zipcode', 'zipcode_token', zipcode_token, zipcode_id);
    }

    async registerZipcode(code, lat, lng, type) {
        try {
            this.instance_id = await this.insertInstance(
                {code, lat, lng, type, cdate: 'now()', udate: 'now()', status: 0}
            );

            this.instance_token = `ZIP-${func.encodeUnify(this.instance_id, 'zip')}`;

            await this.updateInstance({zipcode_token: this.instance_token, status: 1});

            return {zipcode_token: this.instance_token, zipcode_id: this.instance_id};
        } catch (e) {
            throw e;
        }

    }

    static async findAllZipcodeDetail(search_query = {}) {
        try {
            const conditions = new ODCondition();

            const {center_lat, center_lng, zoom, start} = search_query;

            const lat = parseFloat(center_lat);
            const lng = parseFloat(center_lng);

            let zoom_float = parseFloat(zoom);

            if (!lat || !lng || !zoom_float)
                func.throwErrorWithMissingParam('SEARCH QUERY INCOMPLETE');
            conditions
                .configComplexConditionKeys(
                    'es_zipcode',
                    ['code', 'id AS zipcode_id', 'lat', 'lng', 'type'])
                .configComplexConditionQueryItem(
                    'es_zipcode',
                    'status', 1
                )
                .configSimpleCondition(`(
                es_zipcode.lat >= ${lat - zoom_float}
                AND 
                es_zipcode.lat <= ${lat + zoom_float}
                AND 
                es_zipcode.lng >= ${lng - zoom_float}
                AND 
                es_zipcode.lng <= ${lng + zoom_float}
                )`)
                .configQueryLimit(start, 5);



            const count = await this.findCountOfInstance('es_zipcode', conditions);

            if (count === 0) return {record_list: [], count, end: 0};


            const record_list = await this.findInstanceListWithComplexCondition('es_zipcode', conditions);

            return {record_list, count, end: (parseInt(start || 0) + record_list.length)};
        } catch (e) {
            throw e;
        }
    }
}

module.exports = VNZipcode;