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
  optionP1: number;     // Player 1's option (int8)
  keyGame: string;      // Player 1's keygame
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
    optionP1: Number(rawGameData[9]),
    keyGame: rawGameData[10]
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

let keySeed = hexStringToUint8Array ("abcddbe576b4818846aa77e82f4ed5fa78f92766b141f282d36703886d196df39322abcddbe576b4818846aa77e82f4ed5fa78f92766b141f282d36703886d196df39322")
let gameKey = hre.ethers.keccak256(keySeed);

const DEFAULT_BID = hre.ethers.parseEther("0.01");

describe("OddOrEven", function () {

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

    //let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str))).substring(2);

    let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str)));


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

    //let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str))).substring(2);

    let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str)));
    let isOdd = false;

    //await player1Instance.playerInit(isOdd, hashOptionP1In, {value: DEFAULT_BID - 1n});

    await expect(player1Instance.playerInit(isOdd, hashOptionP1In, {value: DEFAULT_BID - 1n}))
    .to.be.revertedWith("Invalid Bid");
  });  
  
  it("should NOT init game (Player1 already chose)", async function () {
    const { oddOrEven, owner, player1, player2 } = await loadFixture(deployFixture);

    const player1Instance = oddOrEven.connect(player1);

    let keygame: string = gameKey.substring(2, gameKey.length)
    let optionP1In: number = 3;
    let optionP1str = optionP1In.toString(16);

    while(optionP1str.length % 2 === 1 )
      optionP1str = "0" + optionP1str;

    //let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str))).substring(2);

    let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str)));
    
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

    //let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str))).substring(2);

    let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str)));

    let isOdd = false;

    await player1Instance.playerInit(isOdd, hashOptionP1In, {value: DEFAULT_BID});

    await player1Instance.quitGame();


    let gameData = fetchGameData(await oddOrEven.gameData());

    //console.log("gameData.hashOptionP1: ", gameData.hashOptionP1);
  
    expect(gameData.hashOptionP1).to.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
    //expect(gameData.hashOptionP1).to.equal(0);
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

    //let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str))).substring(2);

    let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str)));
    let isOdd = false;

    await player1Instance.playerInit(isOdd, hashOptionP1In, {value: DEFAULT_BID});


    let gameData = fetchGameData(await oddOrEven.gameData());

    await hre.ethers.provider.send("evm_setNextBlockTimestamp", [Number(gameData.nLockTime) + 1]);
    await hre.ethers.provider.send("evm_mine", []);


    await player2Instance.acceptGame(4, {value: DEFAULT_BID});

    //console.log("Balance: ", hre.ethers.formatEther(await oddOrEven.getBalance()));

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

//    let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str))).substring(2);
    let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str)));

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

    //let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str))).substring(2);

    let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str))); 
 
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

    let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str)));

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

    let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str)));
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

    let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str)));
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

    let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str)));
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

    let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str)));

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

  it("should give victory to Player 1 ( 3 + 5 even)", async function () {
    const { oddOrEven, owner, player1, player2 } = await loadFixture(deployFixture);

    const player1Instance = oddOrEven.connect(player1);
    const player2Instance = oddOrEven.connect(player2);

    let keygame: string = gameKey.substring(2, gameKey.length)
    let optionP1In: number = 3;
    let optionP1str = optionP1In.toString(16);

    while(optionP1str.length % 2 === 1 )
      optionP1str = "0" + optionP1str;

    let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str)));
    let isOdd = false;

    //console.log("hashOptionP1In: ", hashOptionP1In);

    await player1Instance.playerInit(isOdd, hashOptionP1In, {value: DEFAULT_BID});

    let gameData = fetchGameData(await oddOrEven.gameData());

    await hre.ethers.provider.send("evm_setNextBlockTimestamp", [Number(gameData.nLockTime) + 1]);
    await hre.ethers.provider.send("evm_mine", []);

    await player2Instance.acceptGame(5, {value: DEFAULT_BID});

    gameData = fetchGameData(await oddOrEven.gameData());

    await hre.ethers.provider.send("evm_setNextBlockTimestamp", [Number(gameData.nLockTime) + 1]);
    await hre.ethers.provider.send("evm_mine", []);

    let balanceP1before = await hre.ethers.provider.getBalance(player1.address);
    let balanceP2before = await hre.ethers.provider.getBalance(player2.address);
    let balanceContract = await hre.ethers.provider.getBalance(oddOrEven);

    //console.log("balanceP1: ", balanceP1before);
    //console.log("balanceP2: ", balanceP2before);
    //console.log("balanceContract: ", balanceContract);

    //console.log("hashOptionP1In: ", gameData.hashOptionP1);

    await player1Instance.resultGame(hexStringToUint8Array(keygame), optionP1In);

    let balanceP1after = await hre.ethers.provider.getBalance(player1.address);
    let balanceP2after = await hre.ethers.provider.getBalance(player2.address);
    balanceContract = await hre.ethers.provider.getBalance(oddOrEven);

    //console.log("balanceP1: ", balanceP1after);
    //console.log("balanceP2: ", balanceP2after);
    //console.log("balanceContract: ", balanceContract);

    gameData = fetchGameData(await oddOrEven.gameData());

    let gameDataLast = fetchGameData(await oddOrEven.lastGameRecord());

    //console.log("gameDataLast.keyGame: ", gameDataLast.keyGame);
    //console.log("gameData.keyGame: ", gameData.keyGame);
   
    expect(balanceP1after > balanceP1before).to.equal(true);
    expect(balanceP2after == balanceP2before).to.equal(true);
    expect(gameDataLast.keyGame).to.equal(gameKey);

  });

  it("should give victory to Player 1 ( 3 + 4 odd)", async function () {
    const { oddOrEven, owner, player1, player2 } = await loadFixture(deployFixture);

    const player1Instance = oddOrEven.connect(player1);
    const player2Instance = oddOrEven.connect(player2);

    let keygame: string = gameKey.substring(2, gameKey.length)
    let optionP1In: number = 3;
    let optionP1str = optionP1In.toString(16);

    while(optionP1str.length % 2 === 1 )
      optionP1str = "0" + optionP1str;

    let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str)));
    let isOdd = true;

    await player1Instance.playerInit(isOdd, hashOptionP1In, {value: DEFAULT_BID});

    let gameData = fetchGameData(await oddOrEven.gameData());

    await hre.ethers.provider.send("evm_setNextBlockTimestamp", [Number(gameData.nLockTime) + 1]);
    await hre.ethers.provider.send("evm_mine", []);

    await player2Instance.acceptGame(4, {value: DEFAULT_BID});

    gameData = fetchGameData(await oddOrEven.gameData());

    await hre.ethers.provider.send("evm_setNextBlockTimestamp", [Number(gameData.nLockTime) + 1]);
    await hre.ethers.provider.send("evm_mine", []);

    let balanceP1before = await hre.ethers.provider.getBalance(player1.address);
    let balanceP2before = await hre.ethers.provider.getBalance(player2.address);
    let balanceContract = await hre.ethers.provider.getBalance(oddOrEven);

    await player1Instance.resultGame(hexStringToUint8Array(keygame), optionP1In);

    let balanceP1after = await hre.ethers.provider.getBalance(player1.address);
    let balanceP2after = await hre.ethers.provider.getBalance(player2.address);
    balanceContract = await hre.ethers.provider.getBalance(oddOrEven);
  
    gameData = fetchGameData(await oddOrEven.gameData());

    let gameDataLast = fetchGameData(await oddOrEven.lastGameRecord());
  
    expect(balanceP1after > balanceP1before).to.equal(true);
    expect(balanceP2after == balanceP2before).to.equal(true);
    expect(gameDataLast.keyGame).to.equal(gameKey);

  });

  it("should give victory to Player 1 ( 2 + 4 even)", async function () {
    const { oddOrEven, owner, player1, player2 } = await loadFixture(deployFixture);

    const player1Instance = oddOrEven.connect(player1);
    const player2Instance = oddOrEven.connect(player2);

    let keygame: string = gameKey.substring(2, gameKey.length)
    let optionP1In: number = 2;
    let optionP1str = optionP1In.toString(16);

    while(optionP1str.length % 2 === 1 )
      optionP1str = "0" + optionP1str;

    let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str)));
    let isOdd = false;

    await player1Instance.playerInit(isOdd, hashOptionP1In, {value: DEFAULT_BID});

    let gameData = fetchGameData(await oddOrEven.gameData());

    await hre.ethers.provider.send("evm_setNextBlockTimestamp", [Number(gameData.nLockTime) + 1]);
    await hre.ethers.provider.send("evm_mine", []);

    await player2Instance.acceptGame(4, {value: DEFAULT_BID});

    gameData = fetchGameData(await oddOrEven.gameData());

    await hre.ethers.provider.send("evm_setNextBlockTimestamp", [Number(gameData.nLockTime) + 1]);
    await hre.ethers.provider.send("evm_mine", []);

    let balanceP1before = await hre.ethers.provider.getBalance(player1.address);
    let balanceP2before = await hre.ethers.provider.getBalance(player2.address);
    let balanceContract = await hre.ethers.provider.getBalance(oddOrEven);

    await player1Instance.resultGame(hexStringToUint8Array(keygame), optionP1In);

    let balanceP1after = await hre.ethers.provider.getBalance(player1.address);
    let balanceP2after = await hre.ethers.provider.getBalance(player2.address);
    balanceContract = await hre.ethers.provider.getBalance(oddOrEven);
  
    gameData = fetchGameData(await oddOrEven.gameData());

    let gameDataLast = fetchGameData(await oddOrEven.lastGameRecord());
  
    expect(balanceP1after > balanceP1before).to.equal(true);
    expect(balanceP2after == balanceP2before).to.equal(true);
    expect(gameDataLast.keyGame).to.equal(gameKey);

  });

  it("should give victory to Player 1 ( 2 + 5 odd)", async function () {
    const { oddOrEven, owner, player1, player2 } = await loadFixture(deployFixture);

    const player1Instance = oddOrEven.connect(player1);
    const player2Instance = oddOrEven.connect(player2);

    let keygame: string = gameKey.substring(2, gameKey.length)
    let optionP1In: number = 2;
    let optionP1str = optionP1In.toString(16);

    while(optionP1str.length % 2 === 1 )
      optionP1str = "0" + optionP1str;

    let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str)));
    let isOdd = true;

    await player1Instance.playerInit(isOdd, hashOptionP1In, {value: DEFAULT_BID});

    let gameData = fetchGameData(await oddOrEven.gameData());

    await hre.ethers.provider.send("evm_setNextBlockTimestamp", [Number(gameData.nLockTime) + 1]);
    await hre.ethers.provider.send("evm_mine", []);

    await player2Instance.acceptGame(5, {value: DEFAULT_BID});

    gameData = fetchGameData(await oddOrEven.gameData());

    await hre.ethers.provider.send("evm_setNextBlockTimestamp", [Number(gameData.nLockTime) + 1]);
    await hre.ethers.provider.send("evm_mine", []);

    let balanceP1before = await hre.ethers.provider.getBalance(player1.address);
    let balanceP2before = await hre.ethers.provider.getBalance(player2.address);
    let balanceContract = await hre.ethers.provider.getBalance(oddOrEven);

    await player1Instance.resultGame(hexStringToUint8Array(keygame), optionP1In);

    let balanceP1after = await hre.ethers.provider.getBalance(player1.address);
    let balanceP2after = await hre.ethers.provider.getBalance(player2.address);
    balanceContract = await hre.ethers.provider.getBalance(oddOrEven);
  
    gameData = fetchGameData(await oddOrEven.gameData());

    let gameDataLast = fetchGameData(await oddOrEven.lastGameRecord());
  
    expect(balanceP1after > balanceP1before).to.equal(true);
    expect(balanceP2after == balanceP2before).to.equal(true);
    expect(gameDataLast.keyGame).to.equal(gameKey);

  });

  it("should give victory to Player 2 (wrong p1 keygame)", async function () {
    const { oddOrEven, owner, player1, player2 } = await loadFixture(deployFixture);

    const player1Instance = oddOrEven.connect(player1);
    const player2Instance = oddOrEven.connect(player2);

    let keygame: string = gameKey.substring(2, gameKey.length)
    let optionP1In: number = 2;
    let optionP1str = optionP1In.toString(16);

    while(optionP1str.length % 2 === 1 )
      optionP1str = "0" + optionP1str;

    let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str)));
    let isOdd = true;

    await player1Instance.playerInit(isOdd, hashOptionP1In, {value: DEFAULT_BID});

    let gameData = fetchGameData(await oddOrEven.gameData());

    await hre.ethers.provider.send("evm_setNextBlockTimestamp", [Number(gameData.nLockTime) + 1]);
    await hre.ethers.provider.send("evm_mine", []);

    await player2Instance.acceptGame(5, {value: DEFAULT_BID});

    gameData = fetchGameData(await oddOrEven.gameData());

    await hre.ethers.provider.send("evm_setNextBlockTimestamp", [Number(gameData.nLockTime) + 1]);
    await hre.ethers.provider.send("evm_mine", []);

    let balanceP1before = await hre.ethers.provider.getBalance(player1.address);
    let balanceP2before = await hre.ethers.provider.getBalance(player2.address);
    let balanceContract = await hre.ethers.provider.getBalance(oddOrEven);

    await player1Instance.resultGame(hexStringToUint8Array(keygame.substring(0, keygame.length - 2) + "ab"), optionP1In);

    let balanceP1after = await hre.ethers.provider.getBalance(player1.address);
    let balanceP2after = await hre.ethers.provider.getBalance(player2.address);
    balanceContract = await hre.ethers.provider.getBalance(oddOrEven);

  
    gameData = fetchGameData(await oddOrEven.gameData());

    let gameDataLast = fetchGameData(await oddOrEven.lastGameRecord());
  
    expect(balanceP1after <= balanceP1before).to.equal(true);
    expect(balanceP2after > balanceP2before).to.equal(true);
    //expect(gameDataLast.keyGame).to.equal(gameKey);

  });

  it("should give victory to Player 2 (wrong p1 option)", async function () {
    const { oddOrEven, owner, player1, player2 } = await loadFixture(deployFixture);

    const player1Instance = oddOrEven.connect(player1);
    const player2Instance = oddOrEven.connect(player2);

    let keygame: string = gameKey.substring(2, gameKey.length)
    let optionP1In: number = 2;
    let optionP1str = optionP1In.toString(16);

    while(optionP1str.length % 2 === 1 )
      optionP1str = "0" + optionP1str;

    let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str)));
    let isOdd = true;

    await player1Instance.playerInit(isOdd, hashOptionP1In, {value: DEFAULT_BID});

    let gameData = fetchGameData(await oddOrEven.gameData());

    await hre.ethers.provider.send("evm_setNextBlockTimestamp", [Number(gameData.nLockTime) + 1]);
    await hre.ethers.provider.send("evm_mine", []);

    await player2Instance.acceptGame(5, {value: DEFAULT_BID});

    gameData = fetchGameData(await oddOrEven.gameData());

    await hre.ethers.provider.send("evm_setNextBlockTimestamp", [Number(gameData.nLockTime) + 1]);
    await hre.ethers.provider.send("evm_mine", []);

    let balanceP1before = await hre.ethers.provider.getBalance(player1.address);
    let balanceP2before = await hre.ethers.provider.getBalance(player2.address);
    let balanceContract = await hre.ethers.provider.getBalance(oddOrEven);


    await player1Instance.resultGame(hexStringToUint8Array(keygame), optionP1In - 1);

    let balanceP1after = await hre.ethers.provider.getBalance(player1.address);
    let balanceP2after = await hre.ethers.provider.getBalance(player2.address);
    balanceContract = await hre.ethers.provider.getBalance(oddOrEven);

  
    gameData = fetchGameData(await oddOrEven.gameData());

    let gameDataLast = fetchGameData(await oddOrEven.lastGameRecord());
  
    expect(balanceP1after <= balanceP1before).to.equal(true);
    expect(balanceP2after > balanceP2before).to.equal(true);
    expect(gameDataLast.keyGame).to.equal(gameKey);

  });

  it("should give victory to Player 2 (negative p1 option)", async function () {
    const { oddOrEven, owner, player1, player2 } = await loadFixture(deployFixture);

    const player1Instance = oddOrEven.connect(player1);
    const player2Instance = oddOrEven.connect(player2);

    let keygame: string = gameKey.substring(2, gameKey.length)
    let optionP1In: number = -2;
    let optionP1str = optionP1In.toString(16);

    while(optionP1str.length % 2 === 1 )
      optionP1str = "0" + optionP1str;

    let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str)));
    let isOdd = true;

    await player1Instance.playerInit(isOdd, hashOptionP1In, {value: DEFAULT_BID});

    let gameData = fetchGameData(await oddOrEven.gameData());

    await hre.ethers.provider.send("evm_setNextBlockTimestamp", [Number(gameData.nLockTime) + 1]);
    await hre.ethers.provider.send("evm_mine", []);

    await player2Instance.acceptGame(5, {value: DEFAULT_BID});

    gameData = fetchGameData(await oddOrEven.gameData());

    await hre.ethers.provider.send("evm_setNextBlockTimestamp", [Number(gameData.nLockTime) + 1]);
    await hre.ethers.provider.send("evm_mine", []);

    let balanceP1before = await hre.ethers.provider.getBalance(player1.address);
    let balanceP2before = await hre.ethers.provider.getBalance(player2.address);
    let balanceContract = await hre.ethers.provider.getBalance(oddOrEven);


    await player1Instance.resultGame(hexStringToUint8Array(keygame), optionP1In);

    let balanceP1after = await hre.ethers.provider.getBalance(player1.address);
    let balanceP2after = await hre.ethers.provider.getBalance(player2.address);
    balanceContract = await hre.ethers.provider.getBalance(oddOrEven);
  
    gameData = fetchGameData(await oddOrEven.gameData());

    let gameDataLast = fetchGameData(await oddOrEven.lastGameRecord());
  
    expect(balanceP1after <= balanceP1before).to.equal(true);
    expect(balanceP2after > balanceP2before).to.equal(true);
    expect(gameDataLast.keyGame).to.equal(gameKey);

  });

  it("should claim game", async function () {
    const { oddOrEven, owner, player1, player2 } = await loadFixture(deployFixture);

    const player1Instance = oddOrEven.connect(player1);
    const player2Instance = oddOrEven.connect(player2);

    let keygame: string = gameKey.substring(2, gameKey.length)
    let optionP1In: number = 2;
    let optionP1str = optionP1In.toString(16);

    while(optionP1str.length % 2 === 1 )
      optionP1str = "0" + optionP1str;

    let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str)));
    let isOdd = true;

    await player1Instance.playerInit(isOdd, hashOptionP1In, {value: DEFAULT_BID});

    let gameData = fetchGameData(await oddOrEven.gameData());

    await hre.ethers.provider.send("evm_setNextBlockTimestamp", [Number(gameData.nLockTime) + 1]);
    await hre.ethers.provider.send("evm_mine", []);

    await player2Instance.acceptGame(5, {value: DEFAULT_BID});

    gameData = fetchGameData(await oddOrEven.gameData());

    await hre.ethers.provider.send("evm_setNextBlockTimestamp", [Number(gameData.timeOutP2) + 1]);
    await hre.ethers.provider.send("evm_mine", []);

    let balanceP1before = await hre.ethers.provider.getBalance(player1.address);
    let balanceP2before = await hre.ethers.provider.getBalance(player2.address);
    let balanceContract = await hre.ethers.provider.getBalance(oddOrEven);

    await player2Instance.claimGame();

    let balanceP1after = await hre.ethers.provider.getBalance(player1.address);
    let balanceP2after = await hre.ethers.provider.getBalance(player2.address);
    balanceContract = await hre.ethers.provider.getBalance(oddOrEven);
  
    gameData = fetchGameData(await oddOrEven.gameData());

    let gameDataLast = fetchGameData(await oddOrEven.lastGameRecord());
  
    expect(balanceP1after == balanceP1before).to.equal(true);
    expect(balanceP2after > balanceP2before).to.equal(true);
    expect(gameDataLast.keyGame).to.equal("0x");

  });

  it("should NOT claim game (Not Accepted)", async function () {
    const { oddOrEven, owner, player1, player2 } = await loadFixture(deployFixture);

    const player1Instance = oddOrEven.connect(player1);
    const player2Instance = oddOrEven.connect(player2);

    let keygame: string = gameKey.substring(2, gameKey.length)
    let optionP1In: number = 2;
    let optionP1str = optionP1In.toString(16);

    while(optionP1str.length % 2 === 1 )
      optionP1str = "0" + optionP1str;

    let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str)));
    let isOdd = true;

    await player1Instance.playerInit(isOdd, hashOptionP1In, {value: DEFAULT_BID});

    let gameData = fetchGameData(await oddOrEven.gameData());

    await hre.ethers.provider.send("evm_setNextBlockTimestamp", [Number(gameData.nLockTime) + 1]);
    await hre.ethers.provider.send("evm_mine", []);


    await expect(player2Instance.claimGame()).to.be.revertedWith("Only accepted game can be claimed");

  });

  it("should NOT claim game (Timeout P2)", async function () {
    const { oddOrEven, owner, player1, player2 } = await loadFixture(deployFixture);

    const player1Instance = oddOrEven.connect(player1);
    const player2Instance = oddOrEven.connect(player2);

    let keygame: string = gameKey.substring(2, gameKey.length)
    let optionP1In: number = 2;
    let optionP1str = optionP1In.toString(16);

    while(optionP1str.length % 2 === 1 )
      optionP1str = "0" + optionP1str;

    let hashOptionP1In = (hre.ethers.keccak256(hexStringToUint8Array(keygame + optionP1str)));
    let isOdd = true;

    await player1Instance.playerInit(isOdd, hashOptionP1In, {value: DEFAULT_BID});

    let gameData = fetchGameData(await oddOrEven.gameData());

    await hre.ethers.provider.send("evm_setNextBlockTimestamp", [Number(gameData.nLockTime) + 1]);
    await hre.ethers.provider.send("evm_mine", []);

    await player2Instance.acceptGame(5, {value: DEFAULT_BID});

    gameData = fetchGameData(await oddOrEven.gameData());

    await hre.ethers.provider.send("evm_setNextBlockTimestamp", [Number(gameData.timeOutP2) - 1]);
    await hre.ethers.provider.send("evm_mine", []);

    await expect(player2Instance.claimGame()).to.be.revertedWith("Game can only be claimed afther Player 2 timeout");

  });

 
});