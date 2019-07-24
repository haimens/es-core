const mysql = require('mysql');
const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.EROS_HOST,
    user: process.env.EROS_USER,
    password: process.env.EROS_PASS,
    database: 'eros_core'
});

const performQuery = (query) => {

    return new Promise((resolve, reject) => {
        pool.getConnection((err, conn) => {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                conn.query(query, (err, res) => {
                    if (err) {
                        if (err.errno === 1213) performQuery(query).then(result => resolve(result)).catch(t_err => reject(t_err)); else reject(err);
                    } else resolve(res);
                    conn.release();
                });
            }
        });
    });
};

const performQueryWithNext = (query, next) => {
    return new Promise(resolve => {
        pool.getConnection((err, conn) => {
            if (err) {
                console.log(err);
                next(err);
            } else {
                conn.query(query, (err, res) => {
                    if (err) {
                        if (err.errno === 1213) {
                            performQuery(query).then(result => resolve(result)).catch(t_err => next(t_err));
                        } else {
                            next(err);
                        }
                    } else {
                        resolve(res);
                    }
                    conn.release();
                });
            }
        });
    });
};
const parseResult = (rawData) => {
    let string = JSON.stringify(rawData);
    return JSON.parse(string);
};


const createInsertQuery = (table_name, pack) => {
    let query_key = "(";
    let query_value = " VALUES (";
    let keys = Object.keys(pack);
    for (let i = 0; i < keys.length; i++) {
        let k = keys[i];
        let v = pack[keys[i]];
        query_key += "`" + k + "`, ";
        if (v === 'now()') {
            query_value += v + ", ";
        } else {
            query_value += "'" + mysql_real_escape_string(v) + "', ";
        }
    }
    query_key = query_key.slice(0, query_key.length - 2) + ")";
    query_value = query_value.slice(0, query_value.length - 2) + ")";
    return "INSERT INTO `" + table_name + "` " + query_key + query_value;
};

const createUpdateQuery = (table_name, primary_key, pack, miner_id) => {

    let query = "UPDATE `" + table_name + "` SET";
    let keys = Object.keys(pack);
    for (let i = 0; i < keys.length; i++) {
        let k = keys[i];
        let v = pack[keys[i]];
        if (v === 'now()') {
            query += "`" + k + "` = " + v + ", ";
        } else {
            query += "`" + k + "` = '" + mysql_real_escape_string(v) + "', ";
        }
    }
    query = query.slice(0, query.length - 2) + " WHERE `id` = " + primary_key;
    query += miner_id ? (" AND `miner_id` = " + miner_id) : "";
    return query;
};

const configDataWithError = (message, err, query) => {
    return {
        status: false,
        message: message,
        errMsg: err,
        query: query
    };
};

const configDataWithDefaultResponse = (msg) => {
    return {
        status: false,
        message: "DEFAULT RESPONSE " + msg
    };
};

const mysql_real_escape_string = (str) => {
    if (typeof str !== "string") return str;
    return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
        switch (char) {
            case "\0":
                return "\\0";
            case "\x08":
                return "\\b";
            case "\x09":
                return "\\t";
            case "\x1a":
                return "\\z";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case "\"":
            case "'":
            case "\\":
            case "%":
                return "\\" + char;
        }
    });
};


module.exports.performQuery = performQuery;
module.exports.parseResult = parseResult;
module.exports.createInsertQuery = createInsertQuery;
module.exports.configDataWithError = configDataWithError;
module.exports.configDataWithDefaultResponse = configDataWithDefaultResponse;
module.exports.createUpdateQuery = createUpdateQuery;
module.exports.performQueryWithNext = performQueryWithNext;