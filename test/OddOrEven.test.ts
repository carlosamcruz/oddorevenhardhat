import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

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

  let keySeed = hexStringToUint8Array ("abcddbe576b4818846aa77e82f4ed5fa78f92766b141f282d36703886d196df39322abcddbe576b4818846aa77e82f4ed5fa78f92766b141f282d36703886d196df39322")
  let gameKey = hre.ethers.keccak256(keySeed);

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


  it("should init game", async function () {
    const { oddOrEven, owner, player1, player2 } = await loadFixture(deployFixture);

    const player1Instance = oddOrEven.connect(player1);

    //console.log("gameKey: ", gameKey);
    let keygame: string = gameKey.substring(2, gameKey.length)

    //console.log("keygame: ", keygame);
    //console.log("keygame2: ", gameKey.substring(2));
    let optionP1In: number = 3;

    let optionP1str = optionP1In.toString(16);
    //console.log("optionP1str: ", optionP1str);

    while(optionP1str.length % 2 === 1 )
      optionP1str = "0" + optionP1str;

    //console.log("optionP1str: ", optionP1str);

    let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str))).substring(2);

    //console.log("hashOptionP1In: ", hashOptionP1In);

    let isOdd = false;

    await player1Instance.playerInit(isOdd, hashOptionP1In, {value: DEFAULT_BID});

    let gameData = fetchGameData(await oddOrEven.gameData());

    //console.log("Balance: ", hre.ethers.formatEther(await oddOrEven.getBalance()));
    //console.log("NLockTime: ", gameData.nLockTime);
    //console.log("timeOutP1: ", gameData.timeOutP1);
  
    expect(gameData.hashOptionP1).to.equal(hashOptionP1In);
  });

  it("should NOT init game (Invalid Bid)", async function () {
    const { oddOrEven, owner, player1, player2 } = await loadFixture(deployFixture);

    const player1Instance = oddOrEven.connect(player1);

    let keygame: string = gameKey.substring(2, gameKey.length)
    let optionP1In: number = 3;
    let optionP1str = optionP1In.toString(16);

    while(optionP1str.length % 2 === 1 )
      optionP1str = "0" + optionP1str;

    let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str))).substring(2);
    let isOdd = false;

    //await player1Instance.playerInit(isOdd, hashOptionP1In, {value: DEFAULT_BID - 1n});

    await expect(player1Instance.playerInit(isOdd, hashOptionP1In, {value: DEFAULT_BID - 1n}))
    .to.be.revertedWith("Invalid Bid");
  });

  it("should NOT init game (Invalid hash format)", async function () {
    const { oddOrEven, owner, player1, player2 } = await loadFixture(deployFixture);

    const player1Instance = oddOrEven.connect(player1);

    let keygame: string = gameKey.substring(2, gameKey.length)
    let optionP1In: number = 3;
    let optionP1str = optionP1In.toString(16);

    while(optionP1str.length % 2 === 1 )
      optionP1str = "0" + optionP1str;

    let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str))).substring(2) + "h";
    let isOdd = false;

    await expect(player1Instance.playerInit(isOdd, hashOptionP1In, {value: DEFAULT_BID}))
    .to.be.revertedWith("Invalid hash format");
  });
  
  it("should NOT init game (Player1 already chose)", async function () {
    const { oddOrEven, owner, player1, player2 } = await loadFixture(deployFixture);

    const player1Instance = oddOrEven.connect(player1);

    let keygame: string = gameKey.substring(2, gameKey.length)
    let optionP1In: number = 3;
    let optionP1str = optionP1In.toString(16);

    while(optionP1str.length % 2 === 1 )
      optionP1str = "0" + optionP1str;

    let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str))).substring(2);
    let isOdd = false;

    await player1Instance.playerInit(isOdd, hashOptionP1In, {value: DEFAULT_BID});

    await expect(player1Instance.playerInit(isOdd, hashOptionP1In, {value: DEFAULT_BID}))
    .to.be.revertedWith("Player1 already chose");
  });

  it("should quit game", async function () {
    const { oddOrEven, owner, player1, player2 } = await loadFixture(deployFixture);

    const player1Instance = oddOrEven.connect(player1);

    let keygame: string = gameKey.substring(2, gameKey.length)
    let optionP1In: number = 3;
    let optionP1str = optionP1In.toString(16);

    while(optionP1str.length % 2 === 1 )
      optionP1str = "0" + optionP1str;

    let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str))).substring(2);
    let isOdd = false;

    await player1Instance.playerInit(isOdd, hashOptionP1In, {value: DEFAULT_BID});

    await player1Instance.quitGame();


    let gameData = fetchGameData(await oddOrEven.gameData());
  
    expect(gameData.hashOptionP1).to.equal("");
  });

  it("should NOT quit game (Accepted)", async function () {
    const { oddOrEven, owner, player1, player2 } = await loadFixture(deployFixture);

    const player1Instance = oddOrEven.connect(player1);
    const player2Instance = oddOrEven.connect(player2);


    let keygame: string = gameKey.substring(2, gameKey.length)
    let optionP1In: number = 3;
    let optionP1str = optionP1In.toString(16);

    while(optionP1str.length % 2 === 1 )
      optionP1str = "0" + optionP1str;

    let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str))).substring(2);
    let isOdd = false;

    await player1Instance.playerInit(isOdd, hashOptionP1In, {value: DEFAULT_BID});


    let gameData = fetchGameData(await oddOrEven.gameData());

    await hre.ethers.provider.send("evm_setNextBlockTimestamp", [Number(gameData.nLockTime) + 1]);
    await hre.ethers.provider.send("evm_mine", []);


    await player2Instance.acceptGame(4, {value: DEFAULT_BID});

    console.log("Balance: ", hre.ethers.formatEther(await oddOrEven.getBalance()));

    await expect(player1Instance.quitGame())
    .to.be.revertedWith("Cant quit game after other player accpetance");

  });

  it("should NOT quit game (Not Player 1)", async function () {
    const { oddOrEven, owner, player1, player2 } = await loadFixture(deployFixture);

    const player1Instance = oddOrEven.connect(player1);
    const player2Instance = oddOrEven.connect(player2);


    let keygame: string = gameKey.substring(2, gameKey.length)
    let optionP1In: number = 3;
    let optionP1str = optionP1In.toString(16);

    while(optionP1str.length % 2 === 1 )
      optionP1str = "0" + optionP1str;

    let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str))).substring(2);
    let isOdd = false;

    await player1Instance.playerInit(isOdd, hashOptionP1In, {value: DEFAULT_BID});

    await expect(player2Instance.quitGame())
    .to.be.revertedWith("Only player1 can quit the game");

  });

  it("should accept game", async function () {
    const { oddOrEven, owner, player1, player2 } = await loadFixture(deployFixture);

    const player1Instance = oddOrEven.connect(player1);
    const player2Instance = oddOrEven.connect(player2);

    let keygame: string = gameKey.substring(2, gameKey.length)
    let optionP1In: number = 3;
    let optionP1str = optionP1In.toString(16);

    while(optionP1str.length % 2 === 1 )
      optionP1str = "0" + optionP1str;

    let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str))).substring(2);
    let isOdd = false;

    await player1Instance.playerInit(isOdd, hashOptionP1In, {value: DEFAULT_BID});

    let gameData = fetchGameData(await oddOrEven.gameData());

    await hre.ethers.provider.send("evm_setNextBlockTimestamp", [Number(gameData.nLockTime) + 1]);
    await hre.ethers.provider.send("evm_mine", []);

    await player2Instance.acceptGame(4, {value: DEFAULT_BID});

    gameData = fetchGameData(await oddOrEven.gameData());
  
    expect(gameData.optionP2).to.equal(4);

  });

  it("should NOT accept game (Already Accepted)", async function () {
    const { oddOrEven, owner, player1, player2 } = await loadFixture(deployFixture);

    const player1Instance = oddOrEven.connect(player1);
    const player2Instance = oddOrEven.connect(player2);

    let keygame: string = gameKey.substring(2, gameKey.length)
    let optionP1In: number = 3;
    let optionP1str = optionP1In.toString(16);

    while(optionP1str.length % 2 === 1 )
      optionP1str = "0" + optionP1str;

    let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str))).substring(2);
    let isOdd = false;

    await player1Instance.playerInit(isOdd, hashOptionP1In, {value: DEFAULT_BID});

    let gameData = fetchGameData(await oddOrEven.gameData());

    await hre.ethers.provider.send("evm_setNextBlockTimestamp", [Number(gameData.nLockTime) + 1]);
    await hre.ethers.provider.send("evm_mine", []);

    await player2Instance.acceptGame(4, {value: DEFAULT_BID});

    const player3Instance = oddOrEven.connect(owner);

    gameData = fetchGameData(await oddOrEven.gameData());

    await hre.ethers.provider.send("evm_setNextBlockTimestamp", [Number(gameData.nLockTime) + 1]);
    await hre.ethers.provider.send("evm_mine", []);


    await expect(player3Instance.acceptGame(5, {value: DEFAULT_BID}))
    .to.be.revertedWith("Game Already Accepted");

  });

  it("should NOT accept game (Negative Option)", async function () {
    const { oddOrEven, owner, player1, player2 } = await loadFixture(deployFixture);

    const player1Instance = oddOrEven.connect(player1);
    const player2Instance = oddOrEven.connect(player2);

    let keygame: string = gameKey.substring(2, gameKey.length)
    let optionP1In: number = 3;
    let optionP1str = optionP1In.toString(16);

    while(optionP1str.length % 2 === 1 )
      optionP1str = "0" + optionP1str;

    let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str))).substring(2);
    let isOdd = false;

    await player1Instance.playerInit(isOdd, hashOptionP1In, {value: DEFAULT_BID});

    await expect(player2Instance.acceptGame(-4, {value: DEFAULT_BID}))
    .to.be.revertedWith("Cannot accept negative numbers");

  });

  it("should NOT accept game (Invalid Amount)", async function () {
    const { oddOrEven, owner, player1, player2 } = await loadFixture(deployFixture);

    const player1Instance = oddOrEven.connect(player1);
    const player2Instance = oddOrEven.connect(player2);

    let keygame: string = gameKey.substring(2, gameKey.length)
    let optionP1In: number = 3;
    let optionP1str = optionP1In.toString(16);

    while(optionP1str.length % 2 === 1 )
      optionP1str = "0" + optionP1str;

    let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str))).substring(2);
    let isOdd = false;

    await player1Instance.playerInit(isOdd, hashOptionP1In, {value: DEFAULT_BID});

    await expect(player2Instance.acceptGame(4, {value: DEFAULT_BID + 1n}))
    .to.be.revertedWith("Invalid amount");

  });

  it("should NOT accept game (Timestap == Nlocktime)", async function () {
    const { oddOrEven, owner, player1, player2 } = await loadFixture(deployFixture);

    const player1Instance = oddOrEven.connect(player1);
    const player2Instance = oddOrEven.connect(player2);

    let keygame: string = gameKey.substring(2, gameKey.length)
    let optionP1In: number = 3;
    let optionP1str = optionP1In.toString(16);

    while(optionP1str.length % 2 === 1 )
      optionP1str = "0" + optionP1str;

    let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str))).substring(2);
    let isOdd = false;

    
    await player1Instance.playerInit(isOdd, hashOptionP1In, {value: DEFAULT_BID});

    let gameData = fetchGameData(await oddOrEven.gameData());

    await hre.ethers.provider.send("evm_setNextBlockTimestamp", [Number(gameData.nLockTime)]);
    await hre.ethers.provider.send("evm_mine", []);

    await expect(player2Instance.acceptGame(4, {value: DEFAULT_BID}))
    .to.be.revertedWith("TX locktime cant be lower than base locktime");

  });

  it("should NOT accept game (Timout Player 1)", async function () {
    const { oddOrEven, owner, player1, player2 } = await loadFixture(deployFixture);

    const player1Instance = oddOrEven.connect(player1);
    const player2Instance = oddOrEven.connect(player2);

    let keygame: string = gameKey.substring(2, gameKey.length)
    let optionP1In: number = 3;
    let optionP1str = optionP1In.toString(16);

    while(optionP1str.length % 2 === 1 )
      optionP1str = "0" + optionP1str;

    let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str))).substring(2);
    let isOdd = false;

    const latestBlock = await hre.ethers.provider.getBlock("latest");
    //const latestTimestamp = latestBlock.timestamp;

    if(latestBlock){

      await hre.ethers.provider.send("evm_setNextBlockTimestamp", [latestBlock.timestamp + 2]);
      await hre.ethers.provider.send("evm_mine", []);

    }
      
    await player1Instance.playerInit(isOdd, hashOptionP1In, {value: DEFAULT_BID});

    let gameData = fetchGameData(await oddOrEven.gameData());

    await hre.ethers.provider.send("evm_setNextBlockTimestamp", [Number(gameData.nLockTime) + Number(gameData.timeOut) + 1]);
    await hre.ethers.provider.send("evm_mine", []);

    await expect(player2Instance.acceptGame(4, {value: DEFAULT_BID}))
    .to.be.revertedWith("Cannot accept after player 1 timeout");

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