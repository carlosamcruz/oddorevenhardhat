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


  type GameData = {
    hashOptionP1: string; // Hash of Player 1's option
    timeOut: string;      // Timeout duration in seconds (uint64)
    timeOutP1: string;    // Player 1 timeout timestamp (uint256)
    timeOutP2: string;    // Player 2 timeout timestamp (uint256)
    nLockTime: string;    // Lock time for the game (uint256)
    isOdd: boolean;       // Whether the game is Odd/Even (bool)
    player1: string;      // Player 1's address (address)
    player2: string;      // Player 2's address (address)
    optionP2: number;     // Player 2's option (int8)
  };

  function fetchGameData(rawGameData: any) {
    
    const gameData: GameData = {
      hashOptionP1: rawGameData[0],
      timeOut: rawGameData[1],
      timeOutP1: rawGameData[2],
      timeOutP2: rawGameData[3],
      nLockTime: rawGameData[4],
      isOdd: rawGameData[5],
      player1: rawGameData[6],
      player2: rawGameData[7],
      optionP2: Number(rawGameData[8]),
    };
    return gameData;
  }
  

  const DEFAULT_BID = hre.ethers.parseEther("0.01");

  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {

    const [owner, player1, player2] = await hre.ethers.getSigners();

    const OddOrEven = await hre.ethers.getContractFactory("OddOrEven");
    const oddOrEven = await OddOrEven.deploy();

    return { oddOrEven, owner, player1, player2};
  }

  it("should have created", async function () {
    const { oddOrEven, owner, player1, player2 } = await loadFixture(deployFixture);

    let gameData = fetchGameData(await oddOrEven.gameData());
    
    expect(gameData.optionP2).to.equal(-1);
  });


  /*

  it("keccak256", async function () {
    const { oddOrEven, owner, player1, player2 } = await loadFixture(deployFixture);

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

  */

});