// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/**
 * @title Utilitarios para Keccak256 
 * @author Carlos Augusto de Moraes Cruz
 * @notice Desenvolvido para o jogo p2p Par ou Impar
 */
library Keccak256Utils {
    /**
     * 
     * Concatena os bytes da chave do jogo e optionP1In
     * O resultado da concatenação será usado para gerar o hash keccak256 
     * e comparar com o hash inicial apresenado pelo jogador 1
     */

    function appendByteToBytes(bytes memory keygame, int8 optionP1In) internal pure returns (bytes memory) {

        // Create a new dynamic bytes array with space for the extra byte
        bytes memory keygameOptP1 = new bytes(keygame.length + 1);

        // Copy the original bytes into the new array
        for (uint256 i = 0; i < keygame.length; i++) {
            keygameOptP1[i] = keygame[i];
        }

        // Append the new byte to the end of the array
        keygameOptP1[keygame.length] = bytes1(uint8(optionP1In));

        return keygameOptP1;
    }
}