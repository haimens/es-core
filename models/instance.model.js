const sql = require('../services/db.conn');
const func = require('od-utility');
const ODCondition = require('./condition.model');

class ODInstance {
    constructor(table_name, token_name, instance_token, instance_id) {
        this.instance_token = instance_token;
        this.instance_id = instance_id;
        this.table_name = table_name;
        this.token_name = token_name;
    }

    async insertInstance(pack) {
        if (this.instance_id) return this.instance_id;

        try {
            const query = sql.createInsertQuery(this.table_name, pack);
            const {insertId} = await sql.performQuery(query);
            this.instance_id = insertId;
            return insertId;
        } catch (e) {
            throw e;
        }
    }

    async updateInstance(pack = {}) {
        if (!this.table_name) func.throwErrorWithMissingParam('table_name');
        if (!this.instance_id) func.throwErrorWithMissingParam(`${this.table_name}_id`);

        try {
            pack.udate = 'now()';

            const query = sql.createUpdateQuery(this.table_name, this.instance_id, pack);

            return await sql.performQuery(query);
        } catch (e) {
            throw e;
        }
    }

    async findInstanceDetailWithToken(condition = new ODCondition()) {
        if (!this.instance_token) func.throwErrorWithMissingParam('instance_token');
        if (!this.table_name) func.throwErrorWithMissingParam('table_name');
        if (!this.token_name) func.throwErrorWithMissingParam('token_name');

        try {
            // Config condition
            if (condition instanceof ODCondition) {
                condition.configComplexConditionKeys(this.table_name, [`id AS ${this.table_name}_id`, 'cdate', 'udate'])
                    .configComplexConditionQueryItem(this.table_name, this.token_name, this.instance_token);
            } else if (Array.isArray(condition)) {
                const keyList = condition;
                condition = new ODCondition();
                condition.configComplexConditionKeys(this.table_name, [`id AS ${this.table_name}_id`, 'cdate', 'udate', ...keyList])
                    .configComplexConditionQueryItem(this.table_name, this.token_name, this.instance_token);
            }

            const instance = await this.findInstanceDetail(condition);
            if (!instance) func.throwError(`CANNOT FIND INSTANCE - ${this.table_name} WITH GIVEN ID`);
            this.instance_id = instance[`${this.table_name}_id`];

            return instance;
        } catch (e) {
            throw e;
        }
    }

    async findInstanceDetailWithId(condition = new ODCondition()) {
        if (!this.instance_id) func.throwErrorWithMissingParam('instance_id');
        if (!this.table_name) func.throwErrorWithMissingParam('table_name');
        if (!this.token_name) func.throwErrorWithMissingParam('token_name');

        try {
            // Config condition
            if (condition instanceof ODCondition) {
                condition.configComplexConditionKeys(this.table_name, [this.token_name, 'cdate', 'udate'])
                    .configComplexConditionQueryItem(this.table_name, 'id', this.instance_id);
            } else if (Array.isArray(condition)) {
                const keyList = condition;
                condition = new ODCondition();
                condition.configComplexConditionKeys(this.table_name, [this.token_name, 'cdate', 'udate', ...keyList])
                    .configComplexConditionQueryItem(this.table_name, 'id', this.instance_id);
            }

            const instance = await this.findInstanceDetail(condition);
            if (!instance) func.throwError(`CANNOT FIND INSTANCE - ${this.table_name} WITH GIVEN ID`);
            this.instance_token = instance[this.token_name];

            return instance;
        } catch (e) {
            throw e;
        }
    }

    async findInstanceDetail(condition = new ODCondition()) {
        if (!this.table_name) func.throwErrorWithMissingParam('table_name');

        try {
            const key_str = condition.keys.join(', \n');
            const join_str = condition.joins.join(' \n');
            const condition_str = condition.conditions.join(' \nAND ');

            const query = `SELECT ${key_str} 
            FROM ${this.table_name} 
            ${join_str} 
            WHERE ${condition_str} 
            ${'LIMIT 0, 1'}
            `;

            const [instance] = await sql.parseResult(await sql.performQuery(query));
            if (!instance) func.throwError(`CANNOT FIND INSTANCE - ${this.table_name} WITH GIVEN ID`);

            return instance;
        } catch (err) {
            throw err;
        }
    }

    async modifyInstanceDetailWithToken(pack, legal_keys = []) {
        if (!this.table_name) func.throwErrorWithMissingParam('table_name');
        if (!this.instance_token) func.throwErrorWithMissingParam('instance_token');
        if (!this.token_name) func.throwErrorWithMissingParam('token_name');

        try {
            const checkRes = func.checkIllegalKey(legal_keys, pack);
            if (checkRes) func.throwError(`ILLEGAL KEY - ${checkRes}`, 400);

            if (!this.instance_id) {
                await this.findInstanceDetailWithToken();
            }

            return await this.updateInstance(pack);
        } catch (e) {
            throw e;
        }
    }

    async modifyInstanceDetailWithId(pack, legal_keys = []) {
        if (!this.table_name) func.throwErrorWithMissingParam('table_name');
        if (!this.instance_id) func.throwErrorWithMissingParam('instance_id');
        if (!this.token_name) func.throwErrorWithMissingParam('token_name');

        try {
            const checkRes = func.checkIllegalKey(legal_keys, pack);
            if (checkRes) func.throwError(`ILLEGAL KEY - ${checkRes}`, 400);

            return await this.updateInstance(pack);
        } catch (e) {
            throw e;
        }
    }

    static async performQuery(query) {
        if (!query) func.throwErrorWithMissingParam('query');

        try {
            return sql.parseResult(await sql.performQuery(query));
        } catch (e) {
            throw e;
        }
    }

    static async findCountOfInstance(table_name, condition = new ODCondition(), identifier) {
        if (!table_name) func.throwErrorWithMissingParam('table_name');

        try {
            const query = `SELECT COUNT(${identifier ? identifier : table_name}.id) AS count 
                FROM ${identifier ? (table_name + ' AS ' + identifier) : table_name} 
                ${condition.configConditionQuery()} 
                LIMIT 0, 1
            `;

            const [{count}] = sql.parseResult(await sql.performQuery(query));
            return parseInt(count) || 0;
        } catch (e) {
            throw e;
        }
    }


    static async findInstanceListWithComplexCondition(table_name, condition) {
        try {
            if (!table_name) func.throwErrorWithMissingParam('table_name');
            if (!(condition instanceof ODCondition)) func.throwErrorWithMissingParam('condition');
            if (!Array.isArray(condition.conditions) && conditions.length < 1) func.throwErrorWithMissingParam('conditions');

            const key_str = condition.keys.join(', \n');
            const join_str = condition.joins.join(' \n');
            const condition_str = condition.conditions.join(' \nAND ');
            const order_str = condition.orders;
            const group_str = condition.group;

            const query = `SELECT ${key_str} 
            FROM ${table_name} 
            ${join_str} 
            WHERE ${condition_str} 
            ${order_str ? `ORDER BY ${order_str}` : ''} 
            ${group_str} 
            ${condition.limit || 'LIMIT 0, 30'}
            `;


            return await this.performQuery(query);
        } catch (e) {
            throw e;
        }
    }
}

module.exports = ODInstance;