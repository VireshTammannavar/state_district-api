const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");

let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertStatesToDbResponse = (object) => {
  return {
    stateId: object.state_id,
    stateName: object.state_name,
    population: object.population,
  };
};

// get state details api
app.get("/states/", async (request, response) => {
  const getStatesQuery = `select *
  from 
    state;`;
  const dbStatesArray = await db.all(getStatesQuery);
  response.send(dbStatesArray.map((each) => convertStatesToDbResponse(each)));
});

// get state details of stateId api
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateDetailsQuery = `select * 
    from state
    where state_id=${stateId};`;
  const dbStateDetails = await db.get(getStateDetailsQuery);
  response.send(convertStatesToDbResponse(dbStateDetails));
});

// post districts api
app.post("/districts/", async (request, response) => {
  const districtsDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtsDetails;
  const postQuery = `insert into district
    (district_name,state_id,cases,cured,active,deaths) values 
    ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  await db.run(postQuery);
  response.send("District Successfully Added");
});

const convertDistrictToDbResponse = (object) => {
  return {
    districtId: object.district_id,
    districtName: object.district_name,
    stateId: object.state_id,
    cases: object.cases,
    cured: object.cured,
    active: object.active,
    deaths: object.deaths,
  };
};

// get districtDetails api
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `select * from district
    where district_id=${districtId};`;
  const getDbResponse = await db.get(getDistrictQuery);
  response.send(convertDistrictToDbResponse(getDbResponse));
});

// delete districts api
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `delete from district
    where district_id=${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

// put district api
app.put("/districts/:districtId/", async (request, response) => {
  const putDistrictsDetails = request.body;
  const { districtId } = request.params;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = putDistrictsDetails;
  const putDistrictsQuery = `update district
    set 
    district_name='${districtName}',
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths}
    where district_id=${districtId};`;
  await db.run(putDistrictsQuery);
  response.send("District Details Updated");
});

// get total districts on stateId api
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `select
    sum(cases) as totalCases,
    sum(cured) as totalCured,
    sum(active) as totalActive,
    sum(deaths) as totalDeaths
    from district 
    where state_id=${stateId};`;
  const getDbStats = await db.get(getStatsQuery);
  response.send(getDbStats);
});

// get sateName based on districtId
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `select state_id 
    from 
    district 
    where 
    district_id=${districtId};`;
  const getDistrictIdResponse = await db.get(getDistrictIdQuery);
  //get stateName
  const getStateNameQuery = `select state_name as stateName 
    from state 
    where state_id=${getDistrictIdResponse.state_id};`;
  const getStateNameResponse = await db.get(getStateNameQuery);
  response.send(getStateNameResponse);
});
module.exports = app;
