import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

function hexStringToUint8Array(hexString: string): Uint8Array {
  // Ensure the hex string length is even
  if (hexString.length % 2 !== 0) {
      throw new Error("Hex string must have an even length");
  }

  // Convert the string into an array of bytes
  const byteArray = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < byteArray.length; i++) {
      const byte = hexString.substr(i * 2, 2);
      byteArray[i] = parseInt(byte, 16);
  }

  return byteArray;
}

describe("OddOrEven", function () {

  const DEFAULT_BID = hre.ethers.parseEther("0.01");

  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {

    const [owner, otherAccount] = await hre.ethers.getSigners();

    const OddOrEven = await hre.ethers.getContractFactory("OddOrEven");
    const oddOrEven = await OddOrEven.deploy();

    return { oddOrEven, owner, otherAccount };
  }

  

  it("keccak256", async function () {
    const { oddOrEven, owner, otherAccount } = await loadFixture(deployFixture);

    //const message = await helloWorld.message();

    const status = await oddOrEven.status()
    let text = hexStringToUint8Array ("abcddbe576b4818846aa77e82f4ed5fa78f92766b141f282d36703886d196df39322abcddbe576b4818846aa77e82f4ed5fa78f92766b141f282d36703886d196df39322")

    console.log("hre.ethers.keccak256(abc): ", hre.ethers.keccak256(text));


    expect(status).to.equal("");
  });


  it("Should play int", async function () {
    const { oddOrEven, owner, otherAccount } = await loadFixture(deployFixture);

    let text = hexStringToUint8Array ("abcddbe576b4818846aa77e82f4ed5fa78f92766b141f282d36703886d196df39322abcddbe576b4818846aa77e82f4ed5fa78f92766b141f282d36703886d196df39322")

    const player1Instance = oddOrEven.connect(otherAccount);
    await player1Instance.playerInit(false, hre.ethers.keccak256(text), {value: DEFAULT_BID});

    //const result = await joKenPo.getResult();

    const balance = await oddOrEven.getBalance();

    expect(balance).to.equal(DEFAULT_BID);
    
  });


});