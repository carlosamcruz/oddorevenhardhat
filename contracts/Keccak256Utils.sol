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
     * Compara duas strigs
     *  
     */
    function compare(string memory str1, string memory str2) internal pure returns (bool){
        bytes memory arrA = bytes(str1);
        bytes memory arrB = bytes(str2);

        return arrA.length == arrB.length && keccak256(arrA) == keccak256(arrB);
    }

    /**
     * 
     * Verifica se a string esta no formato digest de keccak256
     *  
     */
    function isValidKeccak256Hex(string memory hash) internal pure returns (bool) {
        bytes memory hashBytes = bytes(hash);

        // Check for length (64 for hex string without `0x`)
        if (hashBytes.length != 64) {
            return false;
        }

        // Check each character to ensure it is a valid hex character
        for (uint256 i = 0; i < hashBytes.length; i++) {
            bytes1 char = hashBytes[i];
            if (
                !(char >= 0x30 && char <= 0x39) && // 0-9
                !(char >= 0x61 && char <= 0x66) && // a-f
                !(char >= 0x41 && char <= 0x46)    // A-F
            ) {
                return false;
            }
        }

        return true;
    }

    /**
     * 
     * Converte a chave do jogo e optionP1In para bytes
     * O resultado da conversão será usado para gerar o hash keccak256 
     * e comparar com o hash inicial apresenado pelo jogador 1
     */
    function appendByteToBytes(string memory keygame, int8 optionP1In) internal pure returns (bytes memory) {
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

    /**
     * 
     * Helper function to convert a string hash (hex string) to bytes32 
     */
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