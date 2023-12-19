import { expect } from "chai";
import { ethers } from "hardhat";
import { GlitchProtocolFactory, GlitchProtocolToken } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import * as fs from "fs";
import { LibZip } from "solady";

const config = {
  salt: ethers.utils.formatBytes32String("test"),
  name: "Test Token",
  symbol: "TEST",
  dataType: "audio/ogg",
  baseUri: "http://127.0.0.1:3000/api/token/",
};

async function createImplementation(glitchFactory: GlitchProtocolFactory): Promise<GlitchProtocolToken> {
  const tokenCount = await glitchFactory.tokenCount();
  const salt = ethers.utils.formatBytes32String("test" + tokenCount.toString());
  await glitchFactory.createToken(salt, config.name, config.symbol, config.dataType, config.baseUri);
  expect(await glitchFactory.tokenCount()).to.equal(tokenCount.add(1));
  const newTokenAddress = await glitchFactory.registeredTokens(0);
  const newImplementation = (await ethers.getContractAt("GlitchProtocolToken", newTokenAddress)) as GlitchProtocolToken;
  expect(await newImplementation.name()).to.equal(config.name);
  return newImplementation;
}

describe("GlitchProtocol", function () {
  // We define a fixture to reuse the same setup in every test.

  let glitchFactory: GlitchProtocolFactory;
  let glitchImplementation: GlitchProtocolToken;
  let owner: SignerWithAddress;

  let minterRole: string;
  let oracleRole: string;
  let ownerRole: string;
  let adminRole: string;

  before(async () => {
    [owner] = await ethers.getSigners();
    const glitchImplementationDeployer = await ethers.getContractFactory("GlitchProtocolToken");
    glitchImplementation = (await glitchImplementationDeployer.deploy()) as GlitchProtocolToken;
    const glitchFactoryDeployer = await ethers.getContractFactory("GlitchProtocolFactory");
    glitchFactory = (await glitchFactoryDeployer.deploy(glitchImplementation.address)) as GlitchProtocolFactory;
    await glitchFactory.deployed();

    minterRole = await glitchImplementation.MINTER_ROLE();
    oracleRole = await glitchImplementation.ORACLE_ROLE();
    ownerRole = await glitchImplementation.OWNER_ROLE();
    adminRole = await glitchImplementation.DEFAULT_ADMIN_ROLE();
  });

  describe("Deployment", function () {
    it("Should have the right implementation", async function () {
      expect(await glitchFactory.implementation()).to.equal(glitchImplementation.address);
    });
  });

  describe("Cloning", function () {
    it("Should create a new instance", async function () {
      const tokenCount = await glitchFactory.tokenCount();
      const salt = ethers.utils.formatBytes32String("test" + tokenCount.toString());
      await glitchFactory.createToken(salt, config.name, config.symbol, config.dataType, config.baseUri);
      expect(await glitchFactory.tokenCount()).to.equal(tokenCount.add(1));
      const newTokenAddress = await glitchFactory.registeredTokens(0);
      const newImplementation = (await ethers.getContractAt(
        "GlitchProtocolToken",
        newTokenAddress,
      )) as GlitchProtocolToken;
      expect(await newImplementation.name()).to.equal(config.name);
    });

    it("Should set up defeault roles", async function () {
      const newImplementation = await createImplementation(glitchFactory);

      expect(await newImplementation.hasRole(adminRole, owner.address)).to.equal(true);
      expect(await newImplementation.hasRole(ownerRole, owner.address)).to.equal(false);
      expect(await newImplementation.hasRole(minterRole, owner.address)).to.equal(false);
      expect(await newImplementation.hasRole(oracleRole, owner.address)).to.equal(false);
    });

    it("Should allow owner to grant roles", async function () {
      const newImplementation = await createImplementation(glitchFactory);

      await newImplementation.grantRole(ownerRole, owner.address);
      await newImplementation.grantRole(minterRole, owner.address);
      await newImplementation.grantRole(oracleRole, owner.address);

      expect(await newImplementation.hasRole(adminRole, owner.address)).to.equal(true);
      expect(await newImplementation.hasRole(ownerRole, owner.address)).to.equal(true);
      expect(await newImplementation.hasRole(minterRole, owner.address)).to.equal(true);
      expect(await newImplementation.hasRole(oracleRole, owner.address)).to.equal(true);
    });
  });

  describe("Streaming", function () {
    it("Should allow oracle role to update stream", async function () {
      const newImplementation = await createImplementation(glitchFactory);

      await newImplementation.grantRole(oracleRole, owner.address);

      const sampleData = await fs.readFileSync("test-data/heartbeat.ogg", "utf8");

      const hexData = Buffer.from(sampleData, "utf8").toString("hex");
      const compressedData = LibZip.flzCompress(hexData);
      await newImplementation.updateStream(compressedData);

      const stream = await newImplementation.stream();
      expect(stream).to.equal(sampleData);
    });
  });

  describe("Minting", function () {
    it("Should allow minter role to mint", async function () {
      const newImplementation = await createImplementation(glitchFactory);

      await newImplementation.grantRole(minterRole, owner.address);

      await newImplementation.mint(owner.address, 1);
      expect(await newImplementation.balanceOf(owner.address)).to.equal(1);
      expect(await newImplementation.ownerOf(1)).to.equal(owner.address);
      expect(await newImplementation.tokenURI(1)).to.equal(config.baseUri + "1");
    });
  });
});
