const func = require('od-utility');

class ODCondition {
    constructor(keys, joins, conditions, orders, limit, group) {
        this.keys = keys || [];
        this.joins = joins || [];
        this.conditions = conditions || [];
        this.orders = orders || '';
        this.limit = limit || '';
        this.group = group || '';
    }

    configComplexConditionKey(table_name, key, identifier) {
        try {
            const prefix = table_name ? `${table_name}.` : '';
            const suffix = identifier ? ` AS ${identifier}` : '';

            this.keys.push(`${prefix}${key}${suffix}`);

            return this;
        } catch (e) {
            throw e;
        }
    }

    configComplexConditionKeys(table_name, keys) {
        try {
            if (keys.length < 1) return '';
            keys.forEach(key => this.keys.push(`${table_name}.${key}`));

            return this;
        } catch (e) {
            throw e;
        }
    }

    configComplexSimpleKey(key_query) {
        try {
            if (key_query) this.keys.push(key_query);
            return this;
        } catch (e) {
            throw e;
        }
    }

    configComplexConditionConcatKeys(keys, identifier, spacer) {
        if (!keys) func.throwErrorWithMissingParam('keys');

        try {
            const prefix = 'CONCAT(';
            const suffix = identifier ? `) AS ${identifier}` : ')';
            const key_str = keys.join(`, ${spacer ? (`'${spacer}', `) : ''}`);

            this.keys.push(`${prefix} ${key_str} ${suffix}`);

            return this;
        } catch (e) {
            throw e;
        }
    }

    configComplexConditionQueryItem(table_name, key, value, operator = '=') {
        try {
            const suffix = (typeof value === "number" || value === 'NULL') ? value : `'${value}'`;
            this.conditions.push(`${table_name}.${key} ${operator} ${suffix}`);

            return this;
        } catch (e) {
            throw e;
        }
    }

    configSimpleGroup(group_query) {
        if (!group_query) return this;
        try {
            this.group = `GROUP BY ${group_query}`;
            return this;
        } catch (e) {
            throw e;
        }
    }

    configComplexConditionJoin(org_table, self_key, tar_table, join_method = 'LEFT JOIN', identifier) {
        try {
            this.joins.push(
                `${join_method} ${tar_table} ${identifier ? ('AS ' + identifier) : ''} 
                ON ${identifier ? identifier : tar_table}.id = ${org_table}.${self_key} `);

            return this;
        } catch (e) {
            throw e;
        }
    }

    configSimpleJoin(join_query) {
        try {
            if (join_query) this.joins.push(join_query);
            return this;
        } catch (e) {
            throw e;
        }
    }

    configComplexConditionJoins(org_table, joins, join_method = 'LEFT JOIN') {
        try {
            joins.forEach(join => this.joins.push(`${join_method} ${join.tar} ON ${join.tar}.id = ${org_table}.${join.key}`));

            return this;
        } catch (e) {
            throw e;
        }
    }

    configStatusJoin(org_table, tar_table) {
        try {
            this.joins.push(`LEFT JOIN ${tar_table} ON ${tar_table}.id = ${org_table}.status`);

            return this;
        } catch (e) {
            throw e;
        }
    }

    configConditionQuery() {
        try {
            const join_str = this.joins ? (Array.isArray(this.joins) ? this.joins.join(' \n') : this.joins) : '';
            const condition_str = Array.isArray(this.conditions) ? this.conditions.join(' \nAND ') : this.conditions;
            const group_str = this.group ? `GROUP BY ${this.group} ` : '';

            return `
            ${join_str} 
            WHERE ${condition_str} 
            ${group_str}
            `;
        } catch (e) {
            throw e;
        }
    }

    configQueryLimit(start = 0, end = 30) {
        try {
            this.limit = `LIMIT ${start}, ${end}`;

            return this;
        } catch (e) {
            throw e;
        }
    }

    configStatusCondition(status, table_name) {
        if (status === 'all' || !status) {
            this.configComplexConditionQueryItem(table_name, 'status', 0, '!=');
        } else {
            this.configComplexConditionQueryItem(table_name, 'status', status);
        }

        return this;
    }

    configDateCondition(date_pack, table_name) {
        const {date_from, date_to, from_key, to_key} = date_pack;
        if (date_from) this.configComplexConditionQueryItem(table_name, (from_key || 'cdate'), date_from, '>=');
        if (date_to) this.configComplexConditionQueryItem(table_name, (to_key || 'cdate'), date_to, '<=');

        return this;
    }


    configComplexOrder(order_key, order_direction, legal_keys, table_name) {
        if (!order_key) return this;

        try {
            if (legal_keys.indexOf(order_key) < 0) func.throwError('ORDER KEY ILLEGAL', 400);
            this.orders = `${table_name}.${order_key} ${order_direction}`;

            return this;
        } catch (e) {
            throw e;
        }
    }

    configSimpleOrder(order_query) {
        if (!order_query) return this;
        try {
            this.orders = order_query;

            return this;
        } catch (e) {
            throw e;
        }
    }


    configSimpleCondition(condition) {
        if (!condition) return this;

        try {
            this.conditions.push(condition);
            return this;
        } catch (e) {
            throw e;
        }
    }

    configKeywordCondition(keys = [], keywords_str, table_name) {
        if (!keywords_str) return this;

        try {
            this.conditions.push(`(${keywords_str.split('+').map(keyword => keys.map(key => `${table_name ? table_name + '.' : ''}${key} LIKE '%${keyword}%'`).join(' OR\n')).join(' OR\n')})`);
            return this;
        } catch (err) {
            throw err;
        }
    }

    printCountQuery() {
        try {
            const query = `SELECT COUNT(${identifier ? identifier : table_name}.id) AS count 
                FROM ${identifier ? (table_name + ' AS ' + identifier) : table_name} 
                ${condition.configConditionQuery()} 
                LIMIT 0, 1
            `;
            console.log(query);
        } catch (e) {
            throw e;
        }

    }

    printRecordQuery(table_name) {
        try {


            const key_str = this.keys.join(', \n');
            const join_str = this.joins.join(' \n');
            const condition_str = this.conditions.join(' \nAND ');
            const order_str = this.orders;
            const group_str = this.group;

            const query = `SELECT ${key_str} 
            FROM ${table_name} 
            ${join_str} 
            WHERE ${condition_str} 
            ${order_str ? `ORDER BY ${order_str}` : ''} 
            ${group_str} 
            ${this.limit || 'LIMIT 0, 30'}
            `;

            console.log(query);
        } catch (e) {
            throw e;
        }
    }
}

module.exports = ODCondition;