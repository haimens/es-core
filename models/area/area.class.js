const ODInstance = require('../instance.model');
const ODCondition = require('../condition.model');


const func = require('od-utility');


class ESArea extends ODInstance {

    constructor(area_token, area_id) {
        super('es_area', 'area_token', area_token, area_id);
    }

    async registerArea(zipcode_id, type) {
        try {
            this.instance_id = await this.insertInstance(
                {zipcode_id, cdate: 'now()', udate: 'now()', status: 0, type}
            );

            this.instance_token = `AREA-${func.encodeUnify(this.instance_id, 'area')}`;

            await this.updateInstance({area_token: this.instance_token, status: 1});
            return {area_token: this.instance_token, area_id: this.instance_id};
        } catch (e) {
            throw e;
        }
    }

    static async findAreaList(zipcode_id) {
        try {
            const conditions = new ODCondition();


            conditions
                .configComplexConditionKeys('es_area', ['id AS area_id'])
                .configComplexConditionQueryItem('es_area', 'zipcode_id', zipcode_id)
                .configComplexConditionQueryItem('es_area', 'status', 1);

            const record_list = await this.findInstanceListWithComplexCondition('es_area', conditions);

            return {record_list};
        } catch (e) {
            throw e;
        }
    }
}

module.exports = ESArea;