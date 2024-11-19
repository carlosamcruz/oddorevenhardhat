// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;
import "./Strings.sol";

contract OddOrEven{

    string public choicePlayer1 = ""; //EVEN or ODD
    string public hashOptionP1 = ""; //hash da opcao do jogador 1

    uint64 public timeOut = 60 * 20; // 20 min;

    uint256 public timeOutP1 = 0;
    uint256 public timeOutP2 = 0;
    uint256 public nLockTime = 0;




    bool public isOdd = true; //EVEN or ODD
    address public  player1;
    address public  player2;

    uint8 private numberPlayer1;

    int8 private optionP2 = -1;

    string public status = "";

    address payable private immutable owner;

    uint256 private bidMin = 0.01 ether;
    uint8 private comission = 1;//percentage


    constructor(){
        //owner = payable (tx.origin);//msg.sender);
        owner = payable (msg.sender);
    }

    function compare(string memory str1, string memory str2) private pure returns (bool){
        bytes memory arrA = bytes(str1);
        bytes memory arrB = bytes(str2);

        return arrA.length == arrB.length && keccak256(arrA) == keccak256(arrB);
    }

    function getBalance() public view returns(uint){
        return address(this).balance;
    }

    function playerInit (bool isOddIn, string memory hashOptionP1In) public payable {
        //require(compare(newChoice, "EVEN") || compare(newChoice, "ODD"), "Choose EVEN or ODD");
        require (msg.value >= bidMin, "Invalid Bid");

        bidMin = msg.value; // o minimo agora é o valor casado pelo jogador 1;

        isOdd = isOddIn;

        string memory message = string.concat("Player1 already chose: ", hashOptionP1);

        require(compare(hashOptionP1, ""), message);

        hashOptionP1 = hashOptionP1In;
        player1 = msg.sender;

        nLockTime = block.timestamp;

        timeOutP1 = nLockTime + timeOut;//conversão

        timeOutP2 = timeOutP1;

        status = string.concat("Player 1 is ", Strings.toHexString(player1), " and chose ", hashOptionP1, ", is Odd: ", isOdd? "true": "false");
    }

    function quitGame() public {

        require(optionP2 == -1, "Cant quit game after other player accpetance");
        require(msg.sender == player1, "Only player1 can quit the game");

        address contractAddress = address(this);
        payable(player1).transfer((contractAddress.balance / 100) * (100 - comission));

        //O resto do balance vai para o dono;
        owner.transfer(contractAddress.balance);
    }

    function acceptGame (int8 optionP2In) public payable {
        //require(compare(newChoice, "EVEN") || compare(newChoice, "ODD"), "Choose EVEN or ODD");
        require (optionP2In > -1, 'Cannot accept negative numbers' );
        require (msg.value == bidMin, "Invalid amount");
        //O jogo não pode ser aceito em um bloco menor que o nLockTime
        //assert(this.ctx.locktime >= this.nLockTime, "TX locktime cant be lower than base locktime");
        require (block.timestamp >= nLockTime, "TX locktime cant be lower than base locktime");
        //assert(this.ctx.locktime <= this.timeOutP1, "Can´t accept after player 1 timeout");
        require (block.timestamp <= timeOutP1, "Cannot accept after player 1 timeout");

        owner.transfer((address(this).balance / 100) * comission);

        player2 = msg.sender;

        timeOutP2 = block.timestamp + ( 2 * timeOut );

        optionP2 = optionP2In;
    }

    function resultGame (string memory keygame, int8 optionP1In) public payable {

        require(optionP2 == -1, "Cant verify result before player 2 accpetance");

        uint8 oddness = isOdd ? 1: 0;

        if(keccak256(appendByteToBytes(keygame, optionP1In)) == _stringToBytes32(hashOptionP1)
            && uint8(optionP1In + optionP2) % 2 == oddness){

            payable(player1).transfer(address(this).balance);
        }
        else{
            payable(player2).transfer(address(this).balance);
        }
    }

    function appendByteToBytes(string memory keygame, int8 optionP1In) public pure returns (bytes memory) {
        // Convert the input string to a bytes array
        bytes memory keygameBytes = bytes(keygame);

        // Create a new dynamic bytes array with space for the extra byte
        bytes memory keygameOptP1 = new bytes(keygameBytes.length + 1);

        // Copy the original bytes into the new array
        for (uint256 i = 0; i < keygameBytes.length; i++) {
            keygameOptP1[i] = keygameBytes[i];
        }

        // Append the new byte to the end of the array
        keygameOptP1[keygameBytes.length] = bytes1(uint8(optionP1In));

        return keygameOptP1;
    }

    // Helper function to convert a string hash (hex string) to bytes32
    function _stringToBytes32(string memory source) internal pure returns (bytes32 result) {
        bytes memory tempBytes = bytes(source);
        if (tempBytes.length != 64) {
            // Ensure the string hash is 64 characters long (representing 32 bytes in hex)
            revert("Invalid hash string length");
        }
        assembly {
            result := mload(add(tempBytes, 32))
        }
    }


}