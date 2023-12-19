import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { GlitchProtocolFactory, GlitchProtocolToken } from "../typechain-types";
import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as fs from "fs";
import { LibZip } from "solady";

dotenv.config();

interface IConfiguration {
  name: string;
  symbol: string;
  dataType: string;
  baseUri: string;
}

const defaultConfig: IConfiguration = {
  name: "Test Token",
  symbol: "TEST",
  dataType: "audio/ogg",
  baseUri: "http://127.0.0.1:3000/api/token/",
};

async function createImplementation(
  hre: HardhatRuntimeEnvironment,
  deployer: string,
  config: IConfiguration = defaultConfig,
): Promise<GlitchProtocolToken> {
  // Get the deployed contract
  const glitchImplementation = (await hre.ethers.getContract("GlitchProtocolToken", deployer)) as GlitchProtocolToken;

  const minterRole = await glitchImplementation.MINTER_ROLE();
  const oracleRole = await glitchImplementation.ORACLE_ROLE();
  const ownerRole = await glitchImplementation.OWNER_ROLE();
  // const adminRole = await glitchImplementation.DEFAULT_ADMIN_ROLE();

  const glitchFactory = (await hre.ethers.getContract("GlitchProtocolFactory", deployer)) as GlitchProtocolFactory;

  const tokenCount = await glitchFactory.tokenCount();
  const salt = ethers.utils.formatBytes32String("test" + tokenCount.toString());
  await glitchFactory.createToken(salt, config.name, config.symbol, config.dataType, config.baseUri);

  const newTokenAddress = await glitchFactory.registeredTokens(tokenCount);
  const newImplementation = (await ethers.getContractAt("GlitchProtocolToken", newTokenAddress)) as GlitchProtocolToken;
  await newImplementation.grantRole(ownerRole, deployer);
  await newImplementation.grantRole(minterRole, deployer);
  await newImplementation.grantRole(oracleRole, deployer);
  return newImplementation;
}

async function streamData(implementation: GlitchProtocolToken, path: string) {
  const sampleData = await fs.readFileSync(path);
  const base64Data = sampleData.toString("base64");
  const dataUrl = `data:audio/ogg;base64,${base64Data}`;

  const hexData = Buffer.from(dataUrl, "utf8").toString("hex");
  const compressedData = LibZip.flzCompress(hexData);
  await implementation.updateStream(compressedData);
}
/**
 * Deploys a contract named "YourContract" using the deployer account and
 * constructor arguments set to the deployer address
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployGlitchProtocol: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network goerli`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn generate` which will fill DEPLOYER_PRIVATE_KEY
    with a random private key in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
  */
  const { deployer } = await hre.getNamedAccounts();

  const newImplementation = await createImplementation(hre, deployer);
  await streamData(newImplementation, "test-data/heartbeat.ogg");

  const implementationB = await createImplementation(hre, deployer);
  await streamData(implementationB, "test-data/bass.ogg");

  const implementationC = await createImplementation(hre, deployer);
  await streamData(implementationC, "test-data/sample.ogg");
};

export default deployGlitchProtocol;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags YourContract
deployGlitchProtocol.tags = ["GlitchProtocol"];
