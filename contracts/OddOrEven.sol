// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;
import "./Strings.sol";

contract OddOrEven{

    string public choicePlayer1 = ""; //EVEN or ODD
    string public hashOptionP1 = ""; //hash da opcao do jogador 1

    bool public isOdd = true; //EVEN or ODD
    address public  player1;
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
        require (msg.value >= bidMin, "Invalid amount");
        //O jogo não pode ser aceito em um bloco menor que o nLockTime
        //assert(this.ctx.locktime >= this.nLockTime, "TX locktime cant be lower than base locktime");
        //assert(this.ctx.locktime <= this.timeOutP1, "Can´t accept after player 1 timeout");

        owner.transfer((address(this).balance / 100) * comission);

        optionP2 = optionP2In;
    }






    function choose (string memory newChoice) public {
        require(compare(newChoice, "EVEN") || compare(newChoice, "ODD"), "Choose EVEN or ODD");

        string memory message = string.concat("Player1 already chose: ", choicePlayer1);

        require(compare(choicePlayer1, ""), message);

        choicePlayer1 = newChoice;
        player1 = msg.sender;

        status = string.concat("Player 1 is ", Strings.toHexString(player1), " and chose ", choicePlayer1);
    }

    function play (uint8 number) public{

        //require(number >=0 && number <=2, "Play 0, 1, or 2");
        require(!compare(choicePlayer1, ""), "first choose your option: EVEN or ODD!");
        require(number > 0, "The number must be grater than 0.");

        //uint8 cpuNumber = random();

        if(msg.sender == player1){
            numberPlayer1 = number;
            status = "Player 1 already played. Waiting player 2 ...";
        }
        else{

            require(numberPlayer1 != 0, "Player 1 needs to play first.");

            bool isEven = (number + numberPlayer1) % 2 == 0;

            string memory message = string.concat(
                "Player 1 choose ",
                choicePlayer1,
                " and plays ",
                Strings.toString(numberPlayer1),
                ". Player2 plays ",
                Strings.toString(number)
            );


            if(isEven && compare(choicePlayer1, "EVEN"))
                status = string.concat(message, " Player1 won!");
            else if(!isEven && compare(choicePlayer1, "ODD"))
                status = string.concat(message, " Player1 won!");
            else 
                status = string.concat(message, " Player2 won!");    

            choicePlayer1 = "";
            numberPlayer1 = 0;
            player1 = address(0);    

        }
    }
}