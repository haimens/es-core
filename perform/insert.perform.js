const mapdata = require('../docs/zip_codes');

const dotenv = require('dotenv');
dotenv.config();

const VNZipcode = require('../models/zipcode/zipcode.class');
const VNLine = require('../models/line/line.class');
const VNPoint = require('../models/point/point.class');

const VNArea = require('../models/area/area.class');

(async () => {
    try {
        const list_lenght = mapdata.features.length;


        // const feature = mapdata.features[0];
        //
        // const {properties, geometry} = feature;
        //
        // console.log(geometry.coordinates[0]);

        // for (let i = 0; i < list_lenght; i++) {
        //
        //     const feature = mapdata.features[0];
        //
        //     const {properties, geometry} = feature;
        //     const {INTPTLAT10: lat_str, INTPTLON10: lng_str, ZCTA5CE10: code} = properties;
        //
        //     console.log(geometry.coordinates[0]);
        //
        //
        // }

        let normal = 0;
        let abnormal = 0;
        const abnormal_list = [];
        for (let i = 0; i < list_lenght; i++) {
            const feature = mapdata.features[i];
            const {properties, geometry} = feature;

            const {INTPTLAT10: lat_str, INTPTLON10: lng_str, ZCTA5CE10: code} = properties;

            const {type, coordinates: line_raw_list} = geometry;

            const zip_lat = parseFloat(lat_str);
            const zip_lng = parseFloat(lng_str);

            const {zipcode_id} = await new VNZipcode().registerZipcode(code, zip_lat, zip_lng, type);


            const cord_type = identifyType(line_raw_list);

            const area_type = cord_type === 3 ? 1 : 2;

            console.log(`HANDLING ${code} - lat: ${zip_lat}, lng:${zip_lng} - ${type}`);

            if (area_type === 1) {
                const {area_id} = await new VNArea().registerArea(zipcode_id, 1);
                await insertPolygon(zipcode_id, area_id, line_raw_list);

            } else {
                await insertMultiPolygon(zipcode_id, line_raw_list);
            }

            if (i % 5 === 0) console.log(`进度: ${i + 1}/${list_lenght} - ${((i + 1) / list_lenght * 100).toFixed(2)} %`);
        }
        // console.log(abnormal_list);
    } catch (e) {
        console.log(e);
    }

})();


function identifyType(coordinates, index = 0) {
    const sub = coordinates[0];
    if (typeof sub === "number") return index + 1; else return identifyType(sub, index + 1);
}

async function insertPolygon(zipcode_id, area_id, line_raw_list) {
    try {
        for (let j = 0; j < line_raw_list.length; j++) {
            // LINE
            const {line_id} = await new VNLine().registerLine(zipcode_id, area_id);

            const line_raw = line_raw_list[j];

            const response = await VNPoint.registerPoints(line_raw, line_id, area_id, zipcode_id);
        }

    } catch (e) {
        throw e;
    }
}

async function insertMultiPolygon(zipcode_id, line_raw_list) {
    try {
        const poly_raw = line_raw_list[0];

        const {area_id} = await new VNArea().registerArea(zipcode_id, 1);
        await insertPolygon(zipcode_id, area_id, poly_raw, 1);

        for (let i = 1; i < line_raw_list.length; i++) {
            const hole_raw = line_raw_list[i];
            const {area_id: hole_area_id} = await new VNArea().registerArea(zipcode_id, 2);
            await insertPolygon(zipcode_id, hole_area_id, hole_raw, 2);
        }
    } catch (e) {
        throw e;
    }
}