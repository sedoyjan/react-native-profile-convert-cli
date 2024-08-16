#!/usr/bin/env node

const { Command } = require("commander");
const { exec } = require("child_process");
const { Select } = require("enquirer");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const {ensureDirSync} = require('fs-extra');
const transformer = require("hermes-profile-transformer").default;

const INDEX_BUNDLE_URL =
  "http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&app=";
const INDEX_MAP_URL =
  "http://localhost:8081/index.map//&platform=android&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&app=";

const program = new Command();

program.option("-p, --package <packageName>", "Android package name");
program.option("-a, --app <appName>", "Android app name");
program.option("-o, --output <output>", "Output directory");

program.parse(process.argv);

const options = program.opts();

if (!options.package) {
  console.error(
    "Please provide an Android package name using the -p or --package option."
  );
  process.exit(1);
}

if (!options.app) {
  console.error(
    "Please provide an Android app name using the -a or --app option."
  );
  process.exit(1);
}

if (!options.output) {
  console.error(
    "Please provide an output directory using the -o or --output option."
  );
  process.exit(1);
}

function downloadFile(url, filename) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, "temp", filename);

    axios({
      method: "get",
      url: url,
      responseType: "stream",
    })
      .then((response) => {
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        writer.on("finish", () => {
          console.log(`File downloaded and saved as: ${filePath}`);
          resolve(filePath);
        });

        writer.on("error", (err) => {
          reject(`Error writing bundle to file: ${err.message}`);
        });
      })
      .catch((error) => {
        reject(`Failed to download bundle: ${error.message}`);
      });
  });
}

function pullProfile(profilePath) {
  return new Promise((resolve, reject) => {
    const pullPath = path.join(__dirname, "temp");
    const command = `adb pull ${profilePath} ${pullPath}`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing adb pull: ${error.message}`);
        reject();
        return;
      }

      if (stderr) {
        console.error(`stderr: ${stderr}`);
        reject();
        return;
      }

      console.log(`✔ Profile pulled successfully`);
      resolve();
    });
  });
}

async function selectProfile(profilesArray) {
  const profiles = profilesArray.map((profile) => {
    return `${profile[0]} ${profile[1]} ${profile[2]}`;
  });

  const prompt = new Select({
    name: "profile",
    message: "Select a profile to use:",
    choices: profiles,
  });

  try {
    const answer = await prompt.run();
    const selectedProfile = profilesArray.find((profile) => {
      const selectedName = answer.split(" ")[2];
      return profile[2].includes(selectedName);
    });
    return selectedProfile;
  } catch (err) {
    console.error("Prompt failed:", err);
  }
}

function convertProfile(profileName) {
  const hermesCpuProfilePath = path.join(__dirname, "temp", profileName);
  ("./sampling-profiler-trace7493917654879703191.cpuprofile");
  const sourceMapPath = path.join(__dirname, "temp", "index.map");
  const sourceMapBundleFileName = path.join(
    __dirname,
    "temp",
    "index.bundle.js"
  );

  const convertedFileName = `${profileName.split(".")[0]}-converted.json`;
  ensureDirSync(options.output);
  const outputFilePath = path.join(options.output, convertedFileName);

  transformer(hermesCpuProfilePath, sourceMapPath, sourceMapBundleFileName)
    .then((events) => {
      return fs.writeFileSync(outputFilePath, JSON.stringify(events), "utf-8");
    })
    .catch((err) => {
      console.log(err);
    });
}

function listCpuProfiles(packageName) {
  const command = `adb shell ls -lt /data/user/0/${packageName}/cache/*.cpuprofile`;

  exec(command, async (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command: ${error.message}`);
      return;
    }

    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }

    const profiles = stdout
      .split("\n")
      .filter((line) => line.includes(".cpuprofile"))
      .map((line) => {
        const parts = line.split(" ").filter((part) => part !== "");
        const date = parts[5];
        const time = parts[6];
        const path = parts[7];
        const name = path.split("/").pop();
        return [date, time, name, path];
      });

    const selectedProfile = await selectProfile(profiles);
    const selectedProfilePath = selectedProfile[3];
    const selectedProfileName = selectedProfile[2];
    console.log(`Processing profile: ${selectedProfilePath}`);

    pullProfile(selectedProfilePath);

    console.log("Downloading bundle...");
    await downloadFile(`${INDEX_BUNDLE_URL}${options.app}`, "index.bundle.js");
    console.log("Downloading map...");
    await downloadFile(`${INDEX_MAP_URL}${options.app}`, "index.map");

    console.log("Converting profile...");
    convertProfile(selectedProfileName);
  });
}

listCpuProfiles(options.package);
