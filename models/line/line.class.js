const ODInstance = require('../instance.model');
const ODCondition = require('../condition.model');


const func = require('od-utility');


class VNLine extends ODInstance {

    constructor(line_token, line_id) {
        super('es_line', 'line_token', line_token);
    }

    async registerLine(zipcode_id, area_id) {
        try {
            this.instance_id = await this.insertInstance(
                {zipcode_id, cdate: 'now()', udate: 'now()', area_id, status: 0}
            );

            this.instance_token = `LINE-${func.encodeUnify(this.instance_id, 'line')}`;

            await this.updateInstance({line_token: this.instance_token, status: 1});
            return {line_token: this.instance_token, line_id: this.instance_id};
        } catch (e) {
            throw e;
        }
    }

    static async findLineListInArea(zipcode_id, area_id) {
        try {
            const conditions = new ODCondition();


            conditions
                .configComplexConditionKeys('es_line', ['id AS line_id'])
                .configComplexConditionQueryItem('es_line', 'zipcode_id', zipcode_id)
                .configComplexConditionQueryItem('es_line', 'area_id', area_id)
                .configComplexConditionQueryItem('es_line', 'status', 1);

            const record_list = await this.findInstanceListWithComplexCondition('es_line', conditions);

            return {record_list};
        } catch (e) {
            throw e;
        }
    }
}

module.exports = VNLine;