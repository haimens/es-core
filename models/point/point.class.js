const ODInstance = require('../instance.model');
const ODCondition = require('../condition.model');


const func = require('od-utility');


class VNPoint extends ODInstance {

    constructor() {
        super('es_point');
    }

    async registerPoint(lat, lng, line_id, area_id, zipcode_id) {

        try {
            this.instance_id = await this.insertInstance({
                lat, lng, line_id, zipcode_id, area_id, status: 1
            });

            return {point_id: this.instance_id};
        } catch (e) {
            throw e;
        }
    }


    static async registerPoints(point_list, line_id, area_id, zipcode_id) {
        try {
            const value_list = point_list.map(array => {
                return `( ${array[1]}, ${array[0]}, ${line_id}, ${area_id}, ${zipcode_id}, 1)`
            });
            const query = `INSERT INTO es_point (lat, lng, line_id, area_id, zipcode_id, status) 
            VALUES ${value_list.join(', ')}`;

            const response = await this.performQuery(query);

            return response;
        } catch (e) {
            throw e;
        }
    }

    static async findPointListWithLine(line_id, area_id, zipcode_id, start = 0) {
        try {
            const conditions = new ODCondition();


            conditions
                .configComplexConditionKeys('es_point', ['lat', 'lng'])
                .configComplexConditionQueryItem('es_point', 'line_id', line_id)
                .configComplexConditionQueryItem('es_point', 'area_id', area_id)
                .configComplexConditionQueryItem('es_point', 'zipcode_id', zipcode_id)
                .configComplexConditionQueryItem('es_point', 'status', 1)
                .configQueryLimit(start, 5000);

            const count = await this.findCountOfInstance('es_point', conditions);

            if (count === 0) return {record_list: [], count, end: 0};

            const raw_list = await this.findInstanceListWithComplexCondition('es_point', conditions);

            const record_list = raw_list.map(info => [info.lng, info.lat]);

            return {record_list, count, end: (parseInt(start || 0) + record_list.length)}

        } catch (e) {
            throw e;
        }
    }
}

module.exports = VNPoint;