import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { GlitchProtocolFactory, GlitchProtocolToken } from "../typechain-types";
import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

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
  const glitchFactory = (await hre.ethers.getContract("GlitchProtocolFactory", deployer)) as GlitchProtocolFactory;
  const tokenCount = await glitchFactory.tokenCount();
  console.log(`Found ${tokenCount} tokens`);
  for (let i = 1; i < tokenCount.toNumber(); i++) {
    console.log(`Setting base URI for token ${i}`);
    const tokenAddress = await glitchFactory.registeredTokens(i);
    const implementation = (await ethers.getContractAt("GlitchProtocolToken", tokenAddress)) as GlitchProtocolToken;
    await implementation.setBaseURI(`https://glitchprotocol.xyz/api/${tokenAddress}/`);
  }
};

export default deployGlitchProtocol;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags YourContract
deployGlitchProtocol.tags = ["BaseUri"];
