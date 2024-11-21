// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;
import "./Keccak256Utils.sol";

/**
 * Jesus is the LORD!!!
 * 
 * @title Contract Odd or Even Peer-to-Peer
 * @author Carlos Augusto de Moraes Cruz
 * @notice Provably Fair Gameplay - On-Chain Verification - Timeout Mechanism
 */
contract OddOrEven{

    // Struct to group all game-related fields
    struct GameData {
        bytes32 hashOptionP1;   // Hash of Player 1's option
        uint64 timeOut;        // Timeout duration in seconds
        uint256 timeOutP1;     // Player 1 timeout timestamp
        uint256 timeOutP2;     // Player 2 timeout timestamp
        uint256 nLockTime;     // Lock time for the game
        bool isOdd;            // Whether the game is Odd/Even
        address player1;       // Player 1's address
        address player2;       // Player 2's address
        int8 optionP2;         // Player 2's option
        int8 optionP1;         // Player 1's option
        bytes keyGame;         // Player 1's keyGame
    }

    // Instance of the struct
    GameData public gameData;
    // Keep the state of the last game until the end of the next
    GameData public lastGameRecord;

    // Immutable owner field
    address payable private immutable owner;

    uint256 bidMin = 0.01 ether;        // Minimum bid amount
    uint8 commission = 1;      // Commission percentage

    constructor(){
        owner = payable (msg.sender);

        gameData.hashOptionP1 = 0; //hash da opcao do jogador 1
        gameData.timeOut = 60 * 20; // 20 min;
        gameData.timeOutP1 = 0;
        gameData.timeOutP2 = 0;
        gameData.nLockTime = 0;
        gameData.isOdd = true; //EVEN or ODD, only player 1 chooses
        gameData.player1 = address(0);
        gameData.player2 = address(0);
        gameData.optionP2 = -1;
        gameData.optionP1 = -1;
        gameData.keyGame = new bytes(0);

        lastGameRecord = gameData;
    }

    /**
     * após finalizar o jogo o reset deve ser chamado
     * o estado da ultima partida fica registrado em lastGameRecord
     */
    function resetGameFields() private{

        lastGameRecord = gameData; // mantem o estado do último jogo para consulta;

        gameData.hashOptionP1 = 0; //hash da opcao do jogador 1
        gameData.player1 = address(0);
        gameData.player2 = address(0);
        gameData.optionP2 = -1;
        gameData.optionP1 = -1;
        gameData.keyGame = new bytes(0);

        bidMin = 0.01 ether;
    }

    /**
     * Inicio de uma partida;
     * 
     * O hashOptionP1In informado pelo jogador um deve ser proviniente 
     * de uma chave de 32 bytes e mais um valor OptionP1 int8 positivo.
     * 
     * Caso OptionP1 seja negativo o resultado levará a vitória altomático do jogador 2
     * no momento que o resultado do jogo for informado  
     *
     * O jogador 1 deve estar atento à temporização do jogo para evitar ficar sem tempo hábil 
     * para responder antes que o resultado seja reivindicado pelo jogador 2.
     *  
     */
    function playerInit (bool isOddIn, bytes32 hashOptionP1In) public payable {

        require (msg.value >= bidMin, "Invalid Bid");
        require (gameData.hashOptionP1 == 0, "Player1 already chose");

        bidMin = msg.value; // o minimo agora é o valor casado pelo jogador 1;

        gameData.isOdd = isOddIn;
        gameData.hashOptionP1 = hashOptionP1In;
        gameData.player1 = msg.sender;

        gameData.nLockTime = block.timestamp;
        gameData.timeOutP1 = gameData.nLockTime + gameData.timeOut;//conversão
        gameData.timeOutP2 = gameData.timeOutP1;
    }

     /**
     * O jogador 1 pode cancelar o jogo a qualquer momento, enquanto o desafio não for aceito;
     * 
     * Depois de aceito, o jogo não pode mais ser cancelado;
     * 
     * No caso de um jogo ainda não aceito, o jogador 1 deve ficar atento na seguinte temporização do jogo
     * para evitar ficar sem tempo hábil para responder antes que o resultado seja reivindicado pelo jogador 2.
     * 
     */
    function quitGame() public {

        require(gameData.optionP2 == -1, "Cant quit game after other player accpetance");
        require(msg.sender == gameData.player1, "Only player1 can quit the game");

        address contractAddress = address(this);
        payable(gameData.player1).transfer((contractAddress.balance / 100) * (100 - commission));

        //O resto do balance vai para o dono do contrato;
        owner.transfer(contractAddress.balance);
        resetGameFields();
    }

    /**
     * Qualquer usuário pode aceitar o desafio de durante o tempo de espera do jogador 1
     * 
     * O valor da aposta casada pelo jogador 2 será o mesmo valor oferecido pelo jogador 1
     * 
     */
    function acceptGame (int8 optionP2In) public payable {
        require (gameData.optionP2 == -1, 'Game Already Accepted' );
        require (optionP2In > -1, 'Cannot accept negative numbers' );
        require (msg.value == bidMin, "Invalid amount");
        //Não existe zero confims no ETH então block.timestamp > gameData.nLockTime
        require (block.timestamp > gameData.nLockTime, "TX locktime cant be lower than base locktime"); //Como testar isso?
        require (block.timestamp <= gameData.timeOutP1, "Cannot accept after player 1 timeout");

        owner.transfer((address(this).balance / 100) * commission);//pagamento da comissão ao dono do contrato

        gameData.player2 = msg.sender;
        gameData.timeOutP2 = block.timestamp + ( 2 * gameData.timeOut );
        gameData.optionP2 = optionP2In;
    }

    /**
     * Este metodo apresenta o resultado do desfio depois que o jogador 2 aceitou o jogo
     * Apenas jogador 1 pode chamar este metodo;
     * 
     * optionP1In não pode ser menor que zero
     *  
     */
    function resultGame (bytes memory keygame, int8 optionP1In) public payable {

        require(gameData.optionP2 > -1, "Cant verify result before player 2 accpetance");
        uint8 oddness = gameData.isOdd ? 1: 0;

        gameData.keyGame = keygame;
        gameData.optionP1 = optionP1In;

        if(
            (keccak256(Keccak256Utils.appendByteToBytes(keygame, optionP1In)) == gameData.hashOptionP1)
            && (uint8(optionP1In + gameData.optionP2) % 2 == oddness) 
            && (optionP1In > -1)
        ){

            payable(gameData.player1).transfer(address(this).balance);
        }
        else{
            payable(gameData.player2).transfer(address(this).balance);
        }

        resetGameFields();
    }

    /*
     * Se o jogador 1 não responder até o time-out do jogador 2, então este método pode ser acionado
     *   
     */
    function claimGame () public {
        require (gameData.optionP2 > -1, 'Only accepted game can be claimed' );
        require (block.timestamp > gameData.timeOutP2, "Game can only be claimed afther Player 2 timeout");
        payable(gameData.player2).transfer(address(this).balance);
        resetGameFields();
    }   
}