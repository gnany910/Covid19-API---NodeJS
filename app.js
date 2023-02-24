const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

app.use(express.json());

const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const InitializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

InitializeDBAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDbObjectToResponseObjectDistrict = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

const convertDbObjectToResponseObjectState = (dbObject) => {
  return {
    stateName: dbObject.state_name,
  };
};

const convertDbObjectToResponseObjectStats = (dbObject) => {
  return {
    totalCases: dbObject.total_cases,
    totalCured: dbObject.total_cured,
    totalActive: dbObject.total_active,
    totalDeaths: dbObject.total_deaths,
  };
};

//API 1

app.get("/states/", async (request, response) => {
  try {
    const getStatesQuery = `
    SELECT *
    FROM state ;`;
    const getStatesArray = await db.all(getStatesQuery);
    response.send(
      getStatesArray.map((eachItem) => {
        return convertDbObjectToResponseObject(eachItem);
      })
    );
  } catch (e) {
    console.log(`Db Error: ${e.message}`);
  }
});

//API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT *
    FROM state
    WHERE state_id = ${stateId};`;

  const getStateById = await db.get(getStateQuery);
  response.send(convertDbObjectToResponseObject(getStateById));
});

//API 3
app.post("/districts/", async (request, response) => {
  try {
    const {
      districtName,
      stateId,
      cases,
      cured,
      active,
      deaths,
    } = request.body;
    const postDistrictsQuery = `
  INSERT INTO
    district (district_name, state_id, cases, cured, active, deaths )
  VALUES
    ('${districtName}', '${stateId}', '${cases}', '${cured}' , '${active}', '${deaths}');`;

    const district = await db.run(postDistrictsQuery);
    response.send("District Successfully Added");
  } catch (e) {
    console.log(`DB Error ${e.message}`);
  }
});

// API 4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictsQuery = `
  SELECT *
  FROM district
  WHERE district_id = ${districtId}`;

  const getDistrict = await db.get(getDistrictsQuery);
  response.send(convertDbObjectToResponseObjectDistrict(getDistrict));
});
// API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictsQuery = `
  DELETE
  FROM district
  WHERE district_id = ${districtId}`;

  const getDistrict = await db.run(getDistrictsQuery);
  response.send("District Removed");
});

// API 6
app.put("/districts/:districtId/", async (request, response) => {
  try {
    const { districtId } = request.params;
    const {
      districtName,
      stateId,
      cases,
      cured,
      active,
      deaths,
    } = request.body;
    const putDistrictsQuery = `
  UPDATE
    district
  SET
    district_name = '${districtName}', 
    state_id = '${stateId}', 
    cases = '${cases}', 
    cured = '${cured}' , 
    active = '${active}', 
    deaths = '${deaths}';`;

    await db.run(putDistrictsQuery);
    response.send("District Details Updated");
  } catch (e) {
    console.log(`DB Error ${e.message}`);
  }
});

// API 7

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
    SELECT 
     SUM(cases) AS total_cases,
    SUM(cured) AS total_cured,
    SUM(active) AS total_active,
    SUM(deaths) AS total_deaths
    FROM 
      district
    WHERE 
      state_id = ${stateId};`;
  const stateStats = await db.get(getStateStatsQuery);
  response.send(convertDbObjectToResponseObjectStats(stateStats));
});
// API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictDetailsQuery = `
   SELECT state_name
    FROM state
    LEFT JOIN district
    ON state.state_id = district.state_id;
    WHERE 
      district_id = ${districtId};`;
  const state = await db.get(getDistrictDetailsQuery);
  response.send(convertDbObjectToResponseObjectState(state));
});
module.exports = app;
